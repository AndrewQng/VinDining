using API.Models.Common;

namespace API.Services;

public class ReservationService : IReservationService
{
    private const decimal PerGuestStandardDeposit = 500_000m;
    private const decimal SetMenuDepositRate = 0.30m;
    private const int LockDurationMinutes = 17;
    private const double FreeCancellationThresholdHours = 4.0;
    private const int NoShowGraceMinutes = 15;

    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _paymentGateway;
    private readonly ITableNotifier _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;

    public ReservationService(
        IApplicationDbContext context,
        IPaymentGateway paymentGateway,
        ITableNotifier tableNotifier,
        ITableConcurrencyLock? tableLock = null)
    {
        _context = context;
        _paymentGateway = paymentGateway;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? DefaultTableLock;
    }

    public async Task<CreateReservationResultDto> CreateReservationAsync(CreateReservationDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Họ tên khách hàng không được để trống.");
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
            throw new ArgumentException("Số điện thoại khách hàng không được để trống.");
        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new ArgumentException("Email khách hàng không được để trống.");
        if (dto.PartySize <= 0)
            throw new ArgumentException("Số lượng khách phải lớn hơn 0.");
        if (dto.ReservationTime < DateTime.UtcNow.AddMinutes(-5))
            throw new InvalidOperationException("Thời gian đặt bàn không được nằm trong quá khứ.");

        await using var lockHandle = await _tableLock.AcquireAsync(dto.TableId, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn với mã {dto.TableId}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng phục vụ.");

        if (table.Capacity < dto.PartySize)
            throw new InvalidOperationException($"Sức chứa của bàn {table.TableNumber} ({table.Capacity} người) nhỏ hơn số lượng khách ({dto.PartySize} người).");

        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, không thể đặt lúc này.");

        var requestedStart = dto.ReservationTime;
        var requestedEnd = dto.ReservationTime.AddMinutes(120);

        var hasConflict = await _context.Reservations
            .AnyAsync(r => r.TableId == table.Id &&
                           (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending) &&
                           r.ReservationTime < requestedEnd &&
                           r.ReservationTime.AddMinutes(r.DurationMinutes) > requestedStart, ct);

        if (hasConflict)
            throw new ConflictException($"Bàn {table.TableNumber} đã có khách giữ chỗ hoặc đặt trước trong khung giờ này.");

        decimal depositAmount;
        if (dto.TastingMenuId.HasValue)
        {
            var tastingMenu = await _context.TastingMenus
                .AsNoTracking()
                .FirstOrDefaultAsync(tm => tm.Id == dto.TastingMenuId.Value, ct);

            if (tastingMenu == null)
                throw new KeyNotFoundException($"Không tìm thấy thực đơn Set Menu {dto.TastingMenuId.Value}.");
            if (!tastingMenu.IsActive)
                throw new InvalidOperationException($"Thực đơn Set Menu '{tastingMenu.Name}' hiện không khả dụng.");

            depositAmount = Math.Round(tastingMenu.Price * dto.PartySize * SetMenuDepositRate, 0);
        }
        else
        {
            depositAmount = PerGuestStandardDeposit * dto.PartySize;
        }

        var normalizedPhone = dto.PhoneNumber.Trim();
        var guest = await _context.Guests.FirstOrDefaultAsync(g => g.PhoneNumber == normalizedPhone, ct);
        if (guest == null)
        {
            guest = new Guest
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName.Trim(),
                PhoneNumber = normalizedPhone,
                Email = dto.Email.Trim().ToLowerInvariant()
            };
            await _context.Guests.AddAsync(guest, ct);
        }
        else
        {
            guest.FullName = dto.FullName.Trim();
            guest.Email = dto.Email.Trim().ToLowerInvariant();
        }

        var bookingCode = $"VD-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}";
        var now = DateTime.UtcNow;

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            BookingCode = bookingCode,
            GuestId = guest.Id,
            Guest = guest,
            TableId = table.Id,
            Table = table,
            ReservationTime = dto.ReservationTime,
            PartySize = dto.PartySize,
            DurationMinutes = 120,
            Status = ReservationStatus.Pending,
            Note = dto.Note,
            CreatedAt = now
        };

        var deposit = new Deposit
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Reservation = reservation,
            Amount = depositAmount,
            PaymentMethod = PaymentMethod.BankTransfer,
            Status = DepositStatus.Pending,
            CreatedAt = now
        };

        if (table.Status == TableStatus.Available)
        {
            table.Status = TableStatus.LockedForPayment;
        }

        await _context.Reservations.AddAsync(reservation, ct);
        await _context.Deposits.AddAsync(deposit, ct);
        await _context.SaveChangesAsync(ct);

        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);

        var paymentUrl = _paymentGateway.GeneratePaymentUrl(
            bookingCode,
            depositAmount,
            $"Dat coc giu cho ban Fine Dining {bookingCode}");

        var expireAt = now.AddMinutes(LockDurationMinutes);

        return new CreateReservationResultDto(
            reservation.Id,
            bookingCode,
            depositAmount,
            paymentUrl,
            expireAt,
            table.TableNumber
        );
    }

    public async Task<bool> ProcessVnPayIpnAsync(VnPayIpnDto paramsDto, IDictionary<string, string>? rawParams = null, CancellationToken ct = default)
    {
        if (!_paymentGateway.VerifyIpnSignature(paramsDto, rawParams))
            return false;

        var bookingCode = paramsDto.vnp_TxnRef;
        if (string.IsNullOrWhiteSpace(bookingCode))
            return false;

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == bookingCode, ct);

        if (reservation == null)
            return false;

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        // Idempotent handling if IPN is delivered multiple times
        if (reservation.Status == ReservationStatus.Confirmed && reservation.Deposit?.Status == DepositStatus.Paid)
            return true;

        if (reservation.Status == ReservationStatus.Completed)
            return true;

        if (paramsDto.vnp_ResponseCode == "00")
        {
            reservation.Status = ReservationStatus.Confirmed;
            reservation.CancelledAt = null;
            reservation.CancelledReason = null;

            if (reservation.Deposit != null)
            {
                reservation.Deposit.Status = DepositStatus.Paid;
                reservation.Deposit.PaidAt = DateTime.UtcNow;
                reservation.Deposit.TransactionId = !string.IsNullOrWhiteSpace(paramsDto.vnp_TransactionNo)
                    ? paramsDto.vnp_TransactionNo
                    : $"VNPAY-{Guid.NewGuid():N}"[..18];
            }

            if (reservation.Table != null && reservation.Table.Status != TableStatus.Occupied)
            {
                reservation.Table.Status = TableStatus.Reserved;
                await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
            }
        }
        else
        {
            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt = DateTime.UtcNow;
            reservation.CancelledReason = $"Thanh toán cọc VNPAY không thành công (Mã phản hồi: {paramsDto.vnp_ResponseCode ?? "N/A"}).";

            if (reservation.Deposit != null)
            {
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;
            }

            if (reservation.Table != null && reservation.Table.Status == TableStatus.LockedForPayment)
            {
                reservation.Table.Status = TableStatus.Available;
                await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
            }
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ConfirmDepositAsync(ConfirmDepositDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.BookingCode))
            throw new ArgumentException("Mã đặt bàn không được để trống.");

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == dto.BookingCode, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {dto.BookingCode}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("Đơn đặt bàn đã hết hạn hoặc đã bị hủy, không thể xác nhận đặt cọc.");

        if (reservation.Status == ReservationStatus.Confirmed && reservation.Deposit?.Status == DepositStatus.Paid)
            return true;

        reservation.Status = ReservationStatus.Confirmed;
        if (reservation.Deposit != null)
        {
            reservation.Deposit.Status = DepositStatus.Paid;
            reservation.Deposit.PaidAt = DateTime.UtcNow;
            reservation.Deposit.PaymentMethod = dto.PaymentMethod;
            reservation.Deposit.TransactionId = string.IsNullOrWhiteSpace(dto.TransactionId)
                ? $"TXN-{Guid.NewGuid():N}"[..16].ToUpperInvariant()
                : dto.TransactionId.Trim();
        }

        if (reservation.Table != null && reservation.Table.Status != TableStatus.Occupied)
        {
            reservation.Table.Status = TableStatus.Reserved;
            await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<CancelReservationResultDto> CancelReservationAsync(CancelReservationDto dto, CancellationToken ct = default)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == dto.BookingCode, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {dto.BookingCode}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("Đơn đặt bàn này đã được hủy trước đó.");

        if (reservation.Status == ReservationStatus.Completed)
            throw new InvalidOperationException("Khách đã nhận bàn cho đơn đặt bàn này, không thể hủy trực tuyến.");

        var hoursUntilDining = (reservation.ReservationTime - DateTime.UtcNow).TotalHours;
        var eligibleForRefund = hoursUntilDining >= FreeCancellationThresholdHours;

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.CancelledReason = string.IsNullOrWhiteSpace(dto.Reason) ? "Khách hàng yêu cầu hủy" : dto.Reason.Trim();

        bool isRefunded = false;
        decimal refundAmount = 0m;

        if (reservation.Deposit != null)
        {
            if (reservation.Deposit.Status == DepositStatus.Paid)
            {
                if (eligibleForRefund)
                {
                    var transactionId = reservation.Deposit.TransactionId ?? Guid.NewGuid().ToString("N");
                    var refundOk = await _paymentGateway.RefundAsync(
                        transactionId,
                        reservation.Deposit.Amount,
                        $"Huy dat ban {reservation.BookingCode}: {reservation.CancelledReason}",
                        ct);

                    if (!refundOk)
                        throw new InvalidOperationException("Cổng thanh toán VNPAY tạm thời không thể xử lý giao dịch hoàn tiền. Vui lòng thử lại.");

                    reservation.Deposit.Status = DepositStatus.Refunded;
                    reservation.Deposit.RefundAmount = reservation.Deposit.Amount;
                    isRefunded = true;
                    refundAmount = reservation.Deposit.Amount;
                }
                else
                {
                    reservation.Deposit.Status = DepositStatus.Forfeited;
                    reservation.Deposit.RefundAmount = 0m;
                }
            }
            else if (reservation.Deposit.Status == DepositStatus.Pending)
            {
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;
            }
        }

        if (reservation.Table != null &&
            (reservation.Table.Status == TableStatus.Reserved || reservation.Table.Status == TableStatus.LockedForPayment))
        {
            reservation.Table.Status = TableStatus.Available;
            await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
        }

        await _context.SaveChangesAsync(ct);

        var message = isRefunded
            ? $"Đã hủy đặt bàn và hoàn 100% tiền cọc ({refundAmount:N0} VNĐ) qua cổng VNPAY."
            : eligibleForRefund
                ? "Đã hủy đặt bàn thành công."
                : "Đã hủy đặt bàn. Do hủy dưới 4 tiếng trước giờ hẹn nên tiền cọc không được hoàn trả theo quy định.";

        return new CancelReservationResultDto(
            Success: true,
            BookingCode: reservation.BookingCode,
            Status: reservation.Status.ToString(),
            IsRefunded: isRefunded,
            RefundAmount: refundAmount,
            Message: message
        );
    }

    public async Task<CancelReservationResultDto> MarkNoShowAsync(string bookingCode, string? reason = null, CancellationToken ct = default)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == bookingCode, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {bookingCode}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (reservation.Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Chỉ có thể đánh dấu vắng mặt cho đơn đặt bàn đã xác nhận đặt cọc.");

        if (DateTime.UtcNow < reservation.ReservationTime.AddMinutes(NoShowGraceMinutes))
            throw new InvalidOperationException($"Chưa hết thời gian ân hạn {NoShowGraceMinutes} phút kể từ giờ hẹn ({reservation.ReservationTime:HH:mm}).");

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.CancelledReason = string.IsNullOrWhiteSpace(reason)
            ? $"Khách vắng mặt quá {NoShowGraceMinutes} phút kể từ giờ hẹn"
            : reason.Trim();

        if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Paid)
        {
            reservation.Deposit.Status = DepositStatus.Forfeited;
            reservation.Deposit.RefundAmount = 0m;
        }

        if (reservation.Table != null && reservation.Table.Status == TableStatus.Reserved)
        {
            reservation.Table.Status = TableStatus.Available;
            await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
        }

        await _context.SaveChangesAsync(ct);

        return new CancelReservationResultDto(
            Success: true,
            BookingCode: reservation.BookingCode,
            Status: reservation.Status.ToString(),
            IsRefunded: false,
            RefundAmount: 0m,
            Message: "Đã ghi nhận khách vắng mặt, tịch thu tiền cọc và giải phóng bàn về trạng thái trống."
        );
    }

    public async Task<List<ReservationDetailDto>> GetReservationsAsync(DateTime? date = null, ReservationStatus? status = null, CancellationToken ct = default)
    {
        var query = _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .AsNoTracking();

        if (date.HasValue)
        {
            var start = date.Value.Date;
            var end = start.AddDays(1);
            query = query.Where(r => r.ReservationTime >= start && r.ReservationTime < end);
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var list = await query.OrderByDescending(r => r.ReservationTime).ToListAsync(ct);

        return list.Select(MapToDetailDto).ToList();
    }

    public async Task<ReservationDetailDto> GetReservationByCodeAsync(string bookingCode, CancellationToken ct = default)
    {
        var r = await _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.BookingCode == bookingCode, ct);

        if (r == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {bookingCode}.");

        return MapToDetailDto(r);
    }

    public async Task<List<AvailableTableDto>> GetAvailableTimeSlotsAsync(DateTime reservationTime, int partySize, TableZone? zone = null, CancellationToken ct = default)
    {
        var requestedStart = reservationTime;
        var requestedEnd = reservationTime.AddMinutes(120);

        var query = _context.Tables.AsNoTracking().Where(t => t.IsActive);

        if (partySize > 0) query = query.Where(t => t.Capacity >= partySize);
        if (zone.HasValue) query = query.Where(t => t.Zone == zone.Value);

        var tables = await query.OrderBy(t => t.TableNumber).ToListAsync(ct);

        var busyTableIds = await _context.Reservations
            .Where(r => (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending) &&
                        r.ReservationTime < requestedEnd &&
                        r.ReservationTime.AddMinutes(r.DurationMinutes) > requestedStart)
            .Select(r => r.TableId)
            .Distinct()
            .ToListAsync(ct);

        var busySet = busyTableIds.ToHashSet();

        return tables
            .Where(t => !busySet.Contains(t.Id) && t.Status != TableStatus.Cleaning)
            .Select(t => new AvailableTableDto(t.Id, t.TableNumber, t.Capacity, t.Zone, t.Status))
            .ToList();
    }

    private static ReservationDetailDto MapToDetailDto(Reservation r) => new(
        r.Id,
        r.BookingCode,
        r.Guest?.FullName ?? "N/A",
        r.Guest?.PhoneNumber ?? "N/A",
        r.Guest?.Email,
        r.TableId,
        r.Table?.TableNumber ?? "N/A",
        r.ReservationTime,
        r.PartySize,
        r.Status,
        r.Note,
        r.Deposit?.Amount,
        r.Deposit?.Status,
        r.Table?.Zone.ToString() ?? "MainHall",
        r.CreatedAt
    );
}
