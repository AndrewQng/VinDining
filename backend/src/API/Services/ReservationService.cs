namespace API.Services;

public class ReservationService : IReservationService
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _paymentGateway;
    private readonly ITableNotifier _tableNotifier;
    private const decimal StandardDepositAmount = 500000m;

    public ReservationService(
        IApplicationDbContext context,
        IPaymentGateway paymentGateway,
        ITableNotifier tableNotifier)
    {
        _context = context;
        _paymentGateway = paymentGateway;
        _tableNotifier = tableNotifier;
    }

    public async Task<CreateReservationResultDto> CreateReservationAsync(CreateReservationDto dto, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn với mã {dto.TableId}.");

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
            throw new InvalidOperationException($"Bàn {table.TableNumber} đã có người đặt trong khung giờ này.");

        var guest = await _context.Guests.FirstOrDefaultAsync(g => g.PhoneNumber == dto.PhoneNumber.Trim(), ct);
        if (guest == null)
        {
            guest = new Guest
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant()
            };
            await _context.Guests.AddAsync(guest, ct);
        }
        else
        {
            guest.FullName = dto.FullName.Trim();
            guest.Email = dto.Email.Trim().ToLowerInvariant();
        }

        var bookingCode = $"VD-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}";

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
            CreatedAt = DateTime.UtcNow
        };

        var deposit = new Deposit
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Reservation = reservation,
            Amount = StandardDepositAmount,
            Status = DepositStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        table.Status = TableStatus.Reserved;

        await _context.Reservations.AddAsync(reservation, ct);
        await _context.Deposits.AddAsync(deposit, ct);
        await _context.SaveChangesAsync(ct);

        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);

        var paymentUrl = _paymentGateway.GeneratePaymentUrl(
            bookingCode,
            StandardDepositAmount,
            $"Dat coc giu cho ban Fine Dining {bookingCode}");

        var expireAt = DateTime.UtcNow.AddMinutes(15);

        return new CreateReservationResultDto(
            reservation.Id,
            bookingCode,
            StandardDepositAmount,
            paymentUrl,
            expireAt
        );
    }

    public async Task<bool> ProcessVnPayIpnAsync(VnPayIpnDto paramsDto, CancellationToken ct = default)
    {
        var bookingCode = paramsDto.vnp_TxnRef;
        if (string.IsNullOrEmpty(bookingCode)) return false;

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == bookingCode, ct);

        if (reservation == null) return false;

        if (paramsDto.vnp_ResponseCode == "00")
        {
            reservation.Status = ReservationStatus.Confirmed;
            if (reservation.Deposit != null)
            {
                reservation.Deposit.Status = DepositStatus.Paid;
                reservation.Deposit.PaidAt = DateTime.UtcNow;
                reservation.Deposit.TransactionId = paramsDto.vnp_TransactionNo ?? Guid.NewGuid().ToString();
            }
            if (reservation.Table != null)
            {
                reservation.Table.Status = TableStatus.Reserved;
                await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
            }
        }
        else
        {
            reservation.Status = ReservationStatus.Cancelled;
            if (reservation.Deposit != null) reservation.Deposit.Status = DepositStatus.Forfeited;
            if (reservation.Table != null)
            {
                reservation.Table.Status = TableStatus.Available;
                await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
            }
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> CancelReservationAsync(CancelReservationDto dto, CancellationToken ct = default)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == dto.BookingCode, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {dto.BookingCode}.");

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("Đơn đặt bàn này đã được hủy trước đó.");

        var hoursUntilDining = (reservation.ReservationTime - DateTime.UtcNow).TotalHours;
        var eligibleForRefund = hoursUntilDining >= 2.0;

        reservation.Status = ReservationStatus.Cancelled;

        if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Paid)
        {
            if (eligibleForRefund)
            {
                var transactionId = reservation.Deposit.TransactionId ?? Guid.NewGuid().ToString();
                var refundOk = await _paymentGateway.RefundAsync(transactionId, reservation.Deposit.Amount, $"Huy dat ban: {dto.Reason}", ct);
                if (refundOk)
                {
                    reservation.Deposit.Status = DepositStatus.Refunded;
                    reservation.Deposit.RefundAmount = reservation.Deposit.Amount;
                }
            }
        }

        if (reservation.Table != null)
        {
            reservation.Table.Status = TableStatus.Available;
            await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status, ct);
        }

        await _context.SaveChangesAsync(ct);
        return true;
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

        return list.Select(r => new ReservationDetailDto(
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
            r.Deposit?.Status
        )).ToList();
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

        return new ReservationDetailDto(
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
            r.Deposit?.Status
        );
    }

    public async Task<List<AvailableTableDto>> GetAvailableTimeSlotsAsync(DateTime reservationTime, int partySize, TableZone? zone = null, CancellationToken ct = default)
    {
        var requestedStart = reservationTime;
        var requestedEnd = reservationTime.AddMinutes(120);

        var query = _context.Tables.AsNoTracking();

        if (partySize > 0) query = query.Where(t => t.Capacity >= partySize);
        if (zone.HasValue) query = query.Where(t => t.Zone == zone.Value);

        var tables = await query.ToListAsync(ct);

        var busyTableIds = await _context.Reservations
            .Where(r => (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending) &&
                        r.ReservationTime < requestedEnd &&
                        r.ReservationTime.AddMinutes(r.DurationMinutes) > requestedStart)
            .Select(r => r.TableId)
            .Distinct()
            .ToListAsync(ct);

        return tables
            .Where(t => !busyTableIds.Contains(t.Id) && t.Status != TableStatus.Cleaning)
            .Select(t => new AvailableTableDto(t.Id, t.TableNumber, t.Capacity, t.Zone, t.Status))
            .ToList();
    }
}
