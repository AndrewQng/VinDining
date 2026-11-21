using System.Globalization;
using System.Text;
using API.Models.Common;

namespace API.Services;

public class ReservationService : IReservationService
{
    private const decimal PerGuestStandardDeposit = 500_000m;
    private const decimal SetMenuDepositRate = 0.30m;
    internal const int LockDurationMinutes = 17;
    private const double FreeCancellationThresholdHours = 4.0;
    private const int NoShowGraceMinutes = 15;
    private const string PreOrderedSetMenuPrefix = "[Set Menu đặt trước: ";
    internal const string UnpaidCancellationMarker = ReservationGuestStatus.UnpaidCancellationMarker;

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

        var now = DateTime.UtcNow;
        if (dto.ReservationTime < now.AddMinutes(-5))
            throw new InvalidOperationException("Thời gian đặt bàn không được nằm trong quá khứ.");

        await using var lockHandle = await _tableLock.AcquireAsync(dto.TableId, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn với mã {dto.TableId}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng phục vụ.");

        if (table.Capacity < dto.PartySize)
            throw new InvalidOperationException($"Sức chứa của bàn {table.TableNumber} ({table.Capacity} người) nhỏ hơn số lượng khách ({dto.PartySize} người).");

        if (table.Status == TableStatus.Cleaning && dto.ReservationTime < now.AddMinutes(60))
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, không thể đặt lúc này.");

        if (table.Status == TableStatus.Occupied && dto.ReservationTime < now.AddMinutes(120))
            throw new ConflictException($"Bàn {table.TableNumber} hiện đang phục vụ khách, vui lòng chọn bàn hoặc khung giờ khác.");

        // Sweep any stale Pending locks (>17 minutes) on this table before checking slot conflicts
        var lockCutoff = now.AddMinutes(-LockDurationMinutes);
        var stalePendingOnTable = await _context.Reservations
            .Include(r => r.Deposit)
            .Where(r => r.TableId == table.Id && r.Status == ReservationStatus.Pending && r.CreatedAt <= lockCutoff)
            .ToListAsync(ct);

        if (stalePendingOnTable.Count > 0)
        {
            foreach (var stale in stalePendingOnTable)
            {
                stale.Status = ReservationStatus.Cancelled;
                stale.CancelledAt = now;
                stale.CancelledReason = ReservationGuestStatus.BuildHoldExpiredReason(LockDurationMinutes);
                if (stale.Deposit != null && stale.Deposit.Status == DepositStatus.Pending)
                {
                    stale.Deposit.Status = DepositStatus.Forfeited;
                    stale.Deposit.RefundAmount = 0m;
                }
            }

            if (table.Status == TableStatus.LockedForPayment)
            {
                var staleIds = stalePendingOnTable.Select(s => s.Id).ToHashSet();
                table.Status = await ResolveSafeTableStatusAfterReleaseAsync(_context, table, staleIds, now, ct);
            }
        }

        var requestedStart = dto.ReservationTime;
        var requestedEnd = dto.ReservationTime.AddMinutes(120);
        var staleExcludedIds = stalePendingOnTable.Select(s => s.Id).ToHashSet();

        var hasConflict = await _context.Reservations
            .AnyAsync(r => r.TableId == table.Id &&
                           !staleExcludedIds.Contains(r.Id) &&
                           (r.Status == ReservationStatus.Confirmed ||
                            (r.Status == ReservationStatus.Pending && r.CreatedAt > lockCutoff)) &&
                           r.ReservationTime < requestedEnd &&
                           r.ReservationTime.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 120) > requestedStart, ct);

        if (hasConflict)
            throw new ConflictException($"Bàn {table.TableNumber} đã có khách giữ chỗ hoặc đặt trước trong khung giờ này.");

        TastingMenu? selectedTastingMenu = null;
        decimal depositAmount;
        var effectiveTastingMenuId = dto.TastingMenuId ?? dto.PreOrderedTastingMenuId;
        if (effectiveTastingMenuId.HasValue && effectiveTastingMenuId.Value != Guid.Empty)
        {
            selectedTastingMenu = await _context.TastingMenus
                .AsNoTracking()
                .FirstOrDefaultAsync(tm => tm.Id == effectiveTastingMenuId.Value, ct);

            if (selectedTastingMenu == null)
                throw new KeyNotFoundException($"Không tìm thấy thực đơn Set Menu {effectiveTastingMenuId.Value}.");
            if (!selectedTastingMenu.IsActive)
                throw new InvalidOperationException($"Thực đơn Set Menu '{selectedTastingMenu.Name}' hiện không khả dụng.");

            depositAmount = Math.Round(selectedTastingMenu.Price * dto.PartySize * SetMenuDepositRate, 0);
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

        var bookingCode = $"VD-{now:yyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpperInvariant()}";
        var formattedNote = FormatNoteWithPreOrderedSetMenu(dto.Note, selectedTastingMenu);

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
            Note = formattedNote,
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

        var isImmediateServiceWindow = dto.ReservationTime <= now.AddHours(12) ||
                                       dto.ReservationTime.AddHours(7).Date == now.AddHours(7).Date;
        if (isImmediateServiceWindow && table.Status == TableStatus.Available)
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
        reservation.Deposit = deposit;

        return new CreateReservationResultDto(
            reservation.Id,
            bookingCode,
            depositAmount,
            paymentUrl,
            expireAt,
            table.TableNumber,
            selectedTastingMenu?.Id,
            selectedTastingMenu?.Name,
            MapToDetailDto(reservation)
        );
    }

    public async Task<bool> ProcessVnPayIpnAsync(VnPayIpnDto paramsDto, IDictionary<string, string>? rawParams = null, CancellationToken ct = default)
    {
        var detailed = await ProcessVnPayIpnDetailedAsync(paramsDto, rawParams, ct);
        return detailed.Success;
    }

    public async Task<VnPayIpnProcessResultDto> ProcessVnPayIpnDetailedAsync(VnPayIpnDto paramsDto, IDictionary<string, string>? rawParams = null, CancellationToken ct = default)
    {
        if (!_paymentGateway.VerifyIpnSignature(paramsDto, rawParams))
            return new VnPayIpnProcessResultDto(false, "97", "Invalid Checksum");

        var bookingCode = !string.IsNullOrWhiteSpace(paramsDto.vnp_TxnRef)
            ? paramsDto.vnp_TxnRef.Trim()
            : rawParams != null && rawParams.TryGetValue("vnp_TxnRef", out var rawTxnRef)
                ? rawTxnRef.Trim()
                : null;

        if (string.IsNullOrWhiteSpace(bookingCode))
            return new VnPayIpnProcessResultDto(false, "01", "Order not found");

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == bookingCode, ct);

        if (reservation == null)
            return new VnPayIpnProcessResultDto(false, "01", "Order not found");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        // Validate vnp_Amount (when non-empty) equals (long)Math.Round(reservation.Deposit.Amount * 100m, 0)
        var rawAmountStr = !string.IsNullOrWhiteSpace(paramsDto.vnp_Amount)
            ? paramsDto.vnp_Amount
            : rawParams != null && rawParams.TryGetValue("vnp_Amount", out var ra)
                ? ra
                : null;

        if (!string.IsNullOrWhiteSpace(rawAmountStr))
        {
            if (reservation.Deposit == null)
                return new VnPayIpnProcessResultDto(false, "04", "Invalid amount");

            var expectedSubUnit = (long)Math.Round(reservation.Deposit.Amount * 100m, 0);
            if (!long.TryParse(rawAmountStr.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var actualSubUnit) ||
                actualSubUnit != expectedSubUnit)
            {
                return new VnPayIpnProcessResultDto(false, "04", "Invalid amount");
            }
        }

        // Idempotent handling if IPN is delivered multiple times
        if (reservation.Status == ReservationStatus.Confirmed && reservation.Deposit?.Status == DepositStatus.Paid)
            return new VnPayIpnProcessResultDto(true, "00", "Confirm Success", IsPaid: true);

        if (reservation.Status == ReservationStatus.Completed)
            return new VnPayIpnProcessResultDto(true, "00", "Confirm Success", IsPaid: true);

        if (reservation.Status == ReservationStatus.Cancelled && reservation.Deposit?.Status == DepositStatus.Refunded)
            return new VnPayIpnProcessResultDto(true, "00", "Late IPN auto-refunded", IsPaid: false, IsAutoRefunded: true);

        var now = DateTime.UtcNow;
        var responseCode = !string.IsNullOrWhiteSpace(paramsDto.vnp_ResponseCode)
            ? paramsDto.vnp_ResponseCode.Trim()
            : rawParams != null && rawParams.TryGetValue("vnp_ResponseCode", out var rc)
                ? rc.Trim()
                : null;

        if (responseCode == "00")
        {
            var duration = reservation.DurationMinutes > 0 ? reservation.DurationMinutes : 120;
            var slotEnd = reservation.ReservationTime.AddMinutes(duration);

            var isExpiredPending = reservation.Status == ReservationStatus.Pending &&
                                   now > reservation.CreatedAt.AddMinutes(LockDurationMinutes);

            var hasConflictingReservation = await _context.Reservations
                .AnyAsync(r => r.Id != reservation.Id &&
                               r.TableId == reservation.TableId &&
                               r.Status == ReservationStatus.Confirmed &&
                               r.ReservationTime < slotEnd &&
                               r.ReservationTime.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 120) > reservation.ReservationTime, ct);

            var isTableOccupiedForShift = reservation.Table != null &&
                                          reservation.Table.Status == TableStatus.Occupied &&
                                          reservation.ReservationTime <= now.AddHours(12);

            // Late IPN arriving after 17m expiration / cancellation or after table was rebooked / occupied -> auto-refund 100%
            if (reservation.Status == ReservationStatus.Cancelled ||
                isExpiredPending ||
                hasConflictingReservation ||
                isTableOccupiedForShift)
            {
                var wasAlreadyCancelled = reservation.Status == ReservationStatus.Cancelled;
                reservation.Status = ReservationStatus.Cancelled;
                reservation.CancelledAt ??= now;

                var transactionNo = !string.IsNullOrWhiteSpace(paramsDto.vnp_TransactionNo)
                    ? paramsDto.vnp_TransactionNo.Trim()
                    : !string.IsNullOrWhiteSpace(reservation.Deposit?.TransactionId)
                        ? reservation.Deposit!.TransactionId
                        : $"VNPAY-LATE-{Guid.NewGuid():N}"[..22];

                if (reservation.Deposit != null)
                {
                    reservation.Deposit.TransactionId = transactionNo;
                    reservation.Deposit.PaidAt ??= now;

                    var refundOk = await _paymentGateway.RefundAsync(
                        transactionNo,
                        reservation.Deposit.Amount,
                        $"Hoan coc tu dong giao dich tre qua han giu ban {reservation.BookingCode}",
                        ct);

                    if (!refundOk)
                    {
                        reservation.Deposit.Status = DepositStatus.Forfeited;
                        reservation.Deposit.RefundAmount = 0m;
                        reservation.CancelledReason = TruncateReason(
                            AppendReason(reservation.CancelledReason, "Giao dịch thanh toán cọc đến trễ sau hạn giữ chỗ, chờ hoàn cọc."));
                        await _context.SaveChangesAsync(ct);
                        return new VnPayIpnProcessResultDto(false, "99", "Auto-refund failed");
                    }

                    reservation.Deposit.Status = DepositStatus.Refunded;
                    reservation.Deposit.RefundAmount = reservation.Deposit.Amount;
                }

                reservation.CancelledReason = TruncateReason(
                    AppendReason(
                        reservation.CancelledReason ?? $"Quá thời hạn giữ chỗ {LockDurationMinutes} phút",
                        "Giao dịch thanh toán cọc đến trễ đã được tự động hoàn 100% qua VNPAY."));

                // Keep table untouched if already cancelled; only release stale LockedForPayment if worker hadn't swept yet
                TableStatus? lateReleaseNotify = null;
                if (!wasAlreadyCancelled &&
                    reservation.Table != null &&
                    reservation.Table.Status == TableStatus.LockedForPayment)
                {
                    var nextStatus = await ResolveSafeTableStatusAfterReleaseAsync(
                        _context,
                        reservation.Table,
                        new[] { reservation.Id },
                        now,
                        ct);

                    if (reservation.Table.Status != nextStatus)
                    {
                        reservation.Table.Status = nextStatus;
                        lateReleaseNotify = nextStatus;
                    }
                }

                await _context.SaveChangesAsync(ct);

                if (lateReleaseNotify.HasValue && reservation.Table != null)
                {
                    await _tableNotifier.NotifyTableStatusChangedAsync(
                        reservation.Table.Id,
                        reservation.Table.TableNumber,
                        lateReleaseNotify.Value,
                        ct);
                }

                return new VnPayIpnProcessResultDto(true, "00", "Late IPN auto-refunded", IsPaid: false, IsAutoRefunded: true);
            }

            reservation.Status = ReservationStatus.Confirmed;
            reservation.CancelledAt = null;
            reservation.CancelledReason = null;

            if (reservation.Deposit != null)
            {
                reservation.Deposit.Status = DepositStatus.Paid;
                reservation.Deposit.PaidAt = now;
                if (!string.IsNullOrWhiteSpace(paramsDto.PaymentMethod))
                {
                    var pm = paramsDto.PaymentMethod.Trim();
                    if (string.Equals(pm, "Card", StringComparison.OrdinalIgnoreCase))
                        reservation.Deposit.PaymentMethod = PaymentMethod.Card;
                    else if (string.Equals(pm, "VietQR", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(pm, "BankTransfer", StringComparison.OrdinalIgnoreCase))
                        reservation.Deposit.PaymentMethod = PaymentMethod.BankTransfer;
                }
                reservation.Deposit.TransactionId = !string.IsNullOrWhiteSpace(paramsDto.vnp_TransactionNo)
                    ? paramsDto.vnp_TransactionNo.Trim()
                    : $"VNPAY-{Guid.NewGuid():N}"[..18];
            }

            TableStatus? confirmedNotify = null;
            var isConfirmedImmediateWindow = reservation.ReservationTime <= now.AddHours(12) ||
                                             reservation.ReservationTime.AddHours(7).Date == now.AddHours(7).Date;
            if (isConfirmedImmediateWindow &&
                reservation.Table != null &&
                reservation.Table.Status != TableStatus.Occupied &&
                reservation.Table.Status != TableStatus.PaymentPending &&
                reservation.Table.Status != TableStatus.Cleaning)
            {
                reservation.Table.Status = TableStatus.Reserved;
                confirmedNotify = TableStatus.Reserved;
            }

            await _context.SaveChangesAsync(ct);

            if (confirmedNotify.HasValue && reservation.Table != null)
            {
                await _tableNotifier.NotifyTableStatusChangedAsync(
                    reservation.Table.Id,
                    reservation.Table.TableNumber,
                    confirmedNotify.Value,
                    ct);
            }

            return new VnPayIpnProcessResultDto(true, "00", "Confirm Success", IsPaid: true);
        }
        else
        {
            if (reservation.Status == ReservationStatus.Cancelled)
                return new VnPayIpnProcessResultDto(true, "00", "Confirm Success", IsPaid: false);

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt = now;
            reservation.CancelledReason = ReservationGuestStatus.BuildVnPayFailedReason(responseCode);

            if (reservation.Deposit != null)
            {
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;
            }

            TableStatus? failedReleaseNotify = null;
            if (reservation.Table != null &&
                (reservation.Table.Status == TableStatus.LockedForPayment || reservation.Table.Status == TableStatus.Reserved))
            {
                var nextStatus = await ResolveSafeTableStatusAfterReleaseAsync(
                    _context,
                    reservation.Table,
                    new[] { reservation.Id },
                    now,
                    ct);

                if (reservation.Table.Status != nextStatus)
                {
                    reservation.Table.Status = nextStatus;
                    failedReleaseNotify = nextStatus;
                }
            }

            await _context.SaveChangesAsync(ct);

            if (failedReleaseNotify.HasValue && reservation.Table != null)
            {
                await _tableNotifier.NotifyTableStatusChangedAsync(
                    reservation.Table.Id,
                    reservation.Table.TableNumber,
                    failedReleaseNotify.Value,
                    ct);
            }

            return new VnPayIpnProcessResultDto(true, "00", "Confirm Success", IsPaid: false);
        }
    }

    public async Task<bool> ConfirmDepositAsync(ConfirmDepositDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.BookingCode))
            throw new ArgumentException("Mã đặt bàn không được để trống.");

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == dto.BookingCode.Trim(), ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {dto.BookingCode}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("Đơn đặt bàn đã hết hạn hoặc đã bị hủy, không thể xác nhận đặt cọc.");

        if (reservation.Status == ReservationStatus.Completed)
        {
            if (reservation.Deposit?.Status == DepositStatus.Paid)
                return true;
            throw new InvalidOperationException("Đơn đặt bàn đã hoàn tất nhận bàn, không thể xác nhận lại đặt cọc.");
        }

        if (reservation.Status == ReservationStatus.Confirmed && reservation.Deposit?.Status == DepositStatus.Paid)
            return true;

        var now = DateTime.UtcNow;
        if (reservation.Status == ReservationStatus.Pending && now > reservation.CreatedAt.AddMinutes(LockDurationMinutes))
        {
            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt = now;
            reservation.CancelledReason = ReservationGuestStatus.BuildHoldExpiredReason(LockDurationMinutes);
            if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Pending)
            {
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;
            }

            if (reservation.Table != null && reservation.Table.Status == TableStatus.LockedForPayment)
            {
                reservation.Table.Status = await ResolveSafeTableStatusAfterReleaseAsync(
                    _context,
                    reservation.Table,
                    new[] { reservation.Id },
                    now,
                    ct);
            }

            await _context.SaveChangesAsync(ct);
            throw new InvalidOperationException("Đơn đặt bàn đã quá thời hạn giữ chỗ 17 phút, không thể xác nhận đặt cọc.");
        }

        reservation.Status = ReservationStatus.Confirmed;
        if (reservation.Deposit != null)
        {
            reservation.Deposit.Status = DepositStatus.Paid;
            reservation.Deposit.PaidAt = now;
            reservation.Deposit.PaymentMethod = dto.PaymentMethod;
            reservation.Deposit.TransactionId = string.IsNullOrWhiteSpace(dto.TransactionId)
                ? $"TXN-{Guid.NewGuid():N}"[..16].ToUpperInvariant()
                : dto.TransactionId.Trim();
        }

        TableStatus? notifyStatus = null;
        if (reservation.Table != null &&
            reservation.Table.Status != TableStatus.Occupied &&
            reservation.Table.Status != TableStatus.Cleaning)
        {
            reservation.Table.Status = TableStatus.Reserved;
            notifyStatus = TableStatus.Reserved;
        }

        await _context.SaveChangesAsync(ct);

        if (notifyStatus.HasValue && reservation.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(reservation.Table.Id, reservation.Table.TableNumber, notifyStatus.Value, ct);
        }

        return true;
    }

    public async Task<CancelReservationResultDto> CancelReservationAsync(CancelReservationDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.BookingCode))
            throw new ArgumentException("Mã đặt bàn không được để trống.");

        var bookingCode = dto.BookingCode.Trim();
        var reservation = await _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .Include(r => r.Orders)
            .FirstOrDefaultAsync(r => r.BookingCode == bookingCode, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {bookingCode}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            var providedPhone = NormalizePhoneNumber(dto.PhoneNumber);
            var registeredPhone = NormalizePhoneNumber(reservation.Guest?.PhoneNumber);
            if (!string.Equals(providedPhone, registeredPhone, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("Số điện thoại xác thực không khớp với thông tin đặt bàn.");
            }
        }

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("Đơn đặt bàn này đã được hủy trước đó.");

        if (reservation.Status == ReservationStatus.Completed ||
            reservation.Orders.Any(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Completed))
        {
            throw new InvalidOperationException("Khách đã nhận bàn cho đơn đặt bàn này, không thể hủy trực tuyến.");
        }

        var now = DateTime.UtcNow;
        if (reservation.ReservationTime <= now)
            throw new InvalidOperationException("Đã đến hoặc quá giờ hẹn phục vụ, không thể hủy đặt bàn trực tuyến. Vui lòng liên hệ nhà hàng.");

        var hoursUntilDining = (reservation.ReservationTime - now).TotalHours;
        var eligibleForRefund = hoursUntilDining >= FreeCancellationThresholdHours;

        if (!eligibleForRefund && dto.ConfirmForfeit == false)
        {
            throw new ConflictException("Hủy dưới 4 tiếng trước giờ hẹn sẽ không được hoàn tiền cọc.");
        }

        var rawReason = string.IsNullOrWhiteSpace(dto.Reason) ? "Khách hàng yêu cầu hủy" : dto.Reason.Trim();
        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = now;
        reservation.CancelledReason = rawReason;

        bool isRefunded = false;
        decimal refundAmount = 0m;

        if (reservation.Deposit != null)
        {
            if (reservation.Deposit.Status == DepositStatus.Paid)
            {
                if (eligibleForRefund)
                {
                    var transactionId = !string.IsNullOrWhiteSpace(reservation.Deposit.TransactionId)
                        ? reservation.Deposit.TransactionId
                        : $"TXN-{Guid.NewGuid():N}"[..16].ToUpperInvariant();

                    var refundOk = await _paymentGateway.RefundAsync(
                        transactionId,
                        reservation.Deposit.Amount,
                        $"Huy dat ban {reservation.BookingCode}: {rawReason}",
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
                reservation.CancelledReason = TruncateReason($"{rawReason} {UnpaidCancellationMarker}");
            }
        }

        TableStatus? notifyStatus = null;
        if (reservation.Table != null &&
            (reservation.Table.Status == TableStatus.Reserved || reservation.Table.Status == TableStatus.LockedForPayment))
        {
            var nextStatus = await ResolveSafeTableStatusAfterReleaseAsync(
                _context,
                reservation.Table,
                new[] { reservation.Id },
                now,
                ct);

            if (reservation.Table.Status != nextStatus)
            {
                reservation.Table.Status = nextStatus;
                notifyStatus = nextStatus;
            }
        }

        await _context.SaveChangesAsync(ct);

        if (notifyStatus.HasValue && reservation.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(
                reservation.Table.Id,
                reservation.Table.TableNumber,
                notifyStatus.Value,
                ct);
        }

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
            Message: message,
            Reservation: MapToDetailDto(reservation)
        );
    }

    public async Task<CancelReservationResultDto> MarkNoShowAsync(string bookingCode, string? reason = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(bookingCode))
            throw new ArgumentException("Mã đặt bàn không được để trống.");

        var normalizedCode = bookingCode.Trim();
        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == normalizedCode, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {normalizedCode}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (reservation.Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Chỉ có thể đánh dấu vắng mặt cho đơn đặt bàn đã xác nhận đặt cọc.");

        var now = DateTime.UtcNow;
        if (now < reservation.ReservationTime.AddMinutes(NoShowGraceMinutes))
            throw new InvalidOperationException($"Chưa hết thời gian ân hạn {NoShowGraceMinutes} phút kể từ giờ hẹn ({reservation.ReservationTime:HH:mm}).");

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = now;
        reservation.CancelledReason = string.IsNullOrWhiteSpace(reason)
            ? $"Khách vắng mặt quá {NoShowGraceMinutes} phút kể từ giờ hẹn"
            : reason.Trim();

        if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Paid)
        {
            reservation.Deposit.Status = DepositStatus.Forfeited;
            reservation.Deposit.RefundAmount = 0m;
        }

        TableStatus? notifyStatus = null;
        if (reservation.Table != null &&
            (reservation.Table.Status == TableStatus.Reserved || reservation.Table.Status == TableStatus.LockedForPayment))
        {
            var nextStatus = await ResolveSafeTableStatusAfterReleaseAsync(
                _context,
                reservation.Table,
                new[] { reservation.Id },
                now,
                ct);

            if (reservation.Table.Status != nextStatus)
            {
                reservation.Table.Status = nextStatus;
                notifyStatus = nextStatus;
            }
        }

        await _context.SaveChangesAsync(ct);

        if (notifyStatus.HasValue && reservation.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(
                reservation.Table.Id,
                reservation.Table.TableNumber,
                notifyStatus.Value,
                ct);
        }

        return new CancelReservationResultDto(
            Success: true,
            BookingCode: reservation.BookingCode,
            Status: reservation.Status.ToString(),
            IsRefunded: false,
            RefundAmount: 0m,
            Message: "Đã ghi nhận khách vắng mặt, tịch thu tiền cọc và cập nhật trạng thái bàn.",
            Reservation: MapToDetailDto(reservation)
        );
    }

    public Task<List<ReservationDetailDto>> GetReservationsAsync(DateTime? date = null, ReservationStatus? status = null, CancellationToken ct = default)
        => GetReservationsAsync(date, status, null, ct);

    public async Task<List<ReservationDetailDto>> GetReservationsAsync(DateTime? date, ReservationStatus? status, string? search, CancellationToken ct = default)
    {
        var query = _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .Where(r => !r.BookingCode.StartsWith("WALKIN-"))
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

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim();
            var normalizedSearchPhone = NormalizePhoneNumber(trimmedSearch);
            list = list.Where(r =>
                r.BookingCode.Contains(trimmedSearch, StringComparison.OrdinalIgnoreCase) ||
                (r.Guest != null && r.Guest.FullName.Contains(trimmedSearch, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(normalizedSearchPhone) &&
                 NormalizePhoneNumber(r.Guest?.PhoneNumber).Contains(normalizedSearchPhone, StringComparison.Ordinal))
            ).ToList();
        }

        return list.Select(MapToDetailDto).ToList();
    }

    public Task<ReservationDetailDto> GetReservationByCodeAsync(string bookingCode, CancellationToken ct = default)
        => GetReservationByCodeAsync(bookingCode, null, ct);

    public async Task<ReservationDetailDto> GetReservationByCodeAsync(string bookingCode, string? phoneNumber, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(bookingCode))
            throw new ArgumentException("Mã đặt bàn không được để trống.");

        var normalizedCode = bookingCode.Trim();
        if (normalizedCode.StartsWith("WALKIN-", StringComparison.OrdinalIgnoreCase))
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {normalizedCode}.");

        var r = await _context.Reservations
            .Include(x => x.Guest)
            .Include(x => x.Table)
            .Include(x => x.Deposit)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.BookingCode == normalizedCode, ct);

        if (r == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {normalizedCode}.");

        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var providedPhone = NormalizePhoneNumber(phoneNumber);
            var registeredPhone = NormalizePhoneNumber(r.Guest?.PhoneNumber);
            if (!string.Equals(providedPhone, registeredPhone, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("Số điện thoại không khớp với thông tin đặt bàn.");
            }
        }

        return MapToDetailDto(r);
    }

    public async Task<List<AvailableTableDto>> GetAvailableTimeSlotsAsync(DateTime reservationTime, int partySize, TableZone? zone = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var lockCutoff = now.AddMinutes(-LockDurationMinutes);
        var requestedStart = reservationTime;
        var requestedEnd = reservationTime.AddMinutes(120);

        var query = _context.Tables.AsNoTracking().Where(t => t.IsActive);

        if (partySize > 0) query = query.Where(t => t.Capacity >= partySize);
        if (zone.HasValue) query = query.Where(t => t.Zone == zone.Value);

        var tables = await query.OrderBy(t => t.TableNumber).ToListAsync(ct);

        var busyTableIds = await _context.Reservations
            .Where(r => (r.Status == ReservationStatus.Confirmed ||
                         (r.Status == ReservationStatus.Pending && r.CreatedAt > lockCutoff)) &&
                        r.ReservationTime < requestedEnd &&
                        r.ReservationTime.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 120) > requestedStart)
            .Select(r => r.TableId)
            .Distinct()
            .ToListAsync(ct);

        var busySet = busyTableIds.ToHashSet();
        var excludeCurrentlyOccupied = requestedStart < now.AddMinutes(120);

        return tables
            .Where(t => !busySet.Contains(t.Id) &&
                        t.Status != TableStatus.Cleaning &&
                        (!excludeCurrentlyOccupied || t.Status != TableStatus.Occupied))
            .Select(t => new AvailableTableDto(t.Id, t.TableNumber, t.Capacity, t.Zone, t.Status, t.PosX, t.PosY))
            .ToList();
    }

    public async Task<List<AvailableSlotGroupDto>> GetAvailableSlotGroupsAsync(DateTime date, int partySize, TableZone? zone = null, CancellationToken ct = default)
    {
        var slotHours = new[] { "18:00", "18:30", "19:00", "19:30", "20:00" };
        var now = DateTime.UtcNow;
        var lockCutoff = now.AddMinutes(-LockDurationMinutes);

        var tablesQuery = _context.Tables.AsNoTracking().Where(t => t.IsActive);
        if (zone.HasValue)
            tablesQuery = tablesQuery.Where(t => t.Zone == zone.Value);

        var zoneTablesAll = await tablesQuery.OrderBy(t => t.TableNumber).ToListAsync(ct);
        var dayStart = date.Date.AddHours(-12);
        var dayEnd = date.Date.AddDays(2);

        var activeReservations = await _context.Reservations
            .AsNoTracking()
            .Where(r => r.ReservationTime >= dayStart && r.ReservationTime <= dayEnd &&
                        (r.Status == ReservationStatus.Confirmed ||
                         (r.Status == ReservationStatus.Pending && r.CreatedAt > lockCutoff)))
            .ToListAsync(ct);

        var vnNowDate = now.AddHours(7).Date;
        var groups = new List<AvailableSlotGroupDto>(slotHours.Length);
        foreach (var time in slotHours)
        {
            var parts = time.Split(':');
            var slotStart = new DateTime(date.Year, date.Month, date.Day, int.Parse(parts[0]), int.Parse(parts[1]), 0, DateTimeKind.Utc).AddHours(-7);
            var slotEnd = slotStart.AddMinutes(120);
            var excludeOccupied = slotStart < now.AddMinutes(120) && date.Date == vnNowDate;

            var zoneSlotTables = new List<SlotTableAvailabilityDto>(zoneTablesAll.Count);
            var availableTables = new List<AvailableTableDto>();

            foreach (var t in zoneTablesAll)
            {
                var hasOverlap = activeReservations.Any(r =>
                    r.TableId == t.Id &&
                    r.ReservationTime < slotEnd &&
                    r.ReservationTime.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 120) > slotStart);

                var unavailable = hasOverlap ||
                                  (slotStart < now.AddMinutes(60) && t.Status == TableStatus.Cleaning) ||
                                  (excludeOccupied && t.Status != TableStatus.Available);

                string availability;
                if (unavailable)
                    availability = "taken";
                else if (partySize > 0 && t.Capacity < partySize)
                    availability = "tooSmall";
                else
                    availability = "available";

                var selectable = availability == "available";
                zoneSlotTables.Add(new SlotTableAvailabilityDto(
                    t.Id,
                    t.TableNumber,
                    t.Capacity,
                    t.Zone,
                    availability,
                    t.PosX,
                    t.PosY,
                    selectable));

                if (selectable)
                {
                    availableTables.Add(new AvailableTableDto(
                        t.Id,
                        t.TableNumber,
                        t.Capacity,
                        t.Zone,
                        t.Status,
                        t.PosX,
                        t.PosY));
                }
            }

            groups.Add(new AvailableSlotGroupDto(time, availableTables, zoneSlotTables));
        }

        return groups;
    }

    internal static async Task<TableStatus> ResolveSafeTableStatusAfterReleaseAsync(
        IApplicationDbContext context,
        Table table,
        IReadOnlyCollection<Guid> excludedReservationIds,
        DateTime utcNow,
        CancellationToken ct = default)
    {
        if (table.Status == TableStatus.Cleaning)
            return TableStatus.Cleaning;

        var hasActiveOrder = await context.Orders
            .AnyAsync(o => o.TableId == table.Id && o.Status == OrderStatus.Processing, ct);

        if (hasActiveOrder || table.Status == TableStatus.Occupied)
            return TableStatus.Occupied;

        var hasOtherConfirmed = await context.Reservations
            .AnyAsync(r => r.TableId == table.Id &&
                           !excludedReservationIds.Contains(r.Id) &&
                           r.Status == ReservationStatus.Confirmed &&
                           r.ReservationTime.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 120) > utcNow, ct);

        if (hasOtherConfirmed)
            return TableStatus.Reserved;

        var lockCutoff = utcNow.AddMinutes(-LockDurationMinutes);
        var hasOtherFreshPending = await context.Reservations
            .AnyAsync(r => r.TableId == table.Id &&
                           !excludedReservationIds.Contains(r.Id) &&
                           r.Status == ReservationStatus.Pending &&
                           r.CreatedAt > lockCutoff &&
                           r.ReservationTime.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 120) > utcNow, ct);

        if (hasOtherFreshPending)
            return TableStatus.LockedForPayment;

        return TableStatus.Available;
    }

    internal static string NormalizePhoneNumber(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return string.Empty;

        var sb = new StringBuilder(phone.Length);
        foreach (var ch in phone.Trim())
        {
            if (char.IsDigit(ch) || (ch == '+' && sb.Length == 0))
            {
                sb.Append(ch);
            }
        }

        var cleaned = sb.ToString();
        if (cleaned.StartsWith("+84", StringComparison.Ordinal))
            return "0" + cleaned[3..];
        if (cleaned.StartsWith("84", StringComparison.Ordinal) && cleaned.Length >= 11)
            return "0" + cleaned[2..];

        return cleaned;
    }

    internal static string? FormatNoteWithPreOrderedSetMenu(string? rawNote, TastingMenu? tastingMenu)
    {
        var trimmed = string.IsNullOrWhiteSpace(rawNote) ? null : rawNote.Trim();
        if (tastingMenu == null)
            return trimmed;

        if (trimmed != null &&
            (trimmed.Contains(PreOrderedSetMenuPrefix, StringComparison.OrdinalIgnoreCase) ||
             trimmed.Contains(tastingMenu.Id.ToString(), StringComparison.OrdinalIgnoreCase)))
        {
            return trimmed.Length <= 1000 ? trimmed : trimmed[..1000];
        }

        var tag = $"{PreOrderedSetMenuPrefix}{tastingMenu.Name} ({tastingMenu.Id})]";
        var combined = trimmed == null ? tag : $"{tag} {trimmed}";
        return combined.Length <= 1000 ? combined : combined[..1000];
    }

    internal static (Guid? TastingMenuId, string? TastingMenuName) ParsePreOrderedSetMenu(string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
            return (null, null);

        var startIdx = note.IndexOf(PreOrderedSetMenuPrefix, StringComparison.OrdinalIgnoreCase);
        if (startIdx < 0)
            return (null, null);

        var contentStart = startIdx + PreOrderedSetMenuPrefix.Length;
        var closeIdx = note.IndexOf(")]", contentStart, StringComparison.Ordinal);
        if (closeIdx < 0)
            return (null, null);

        var inner = note[contentStart..closeIdx];
        var guidSepIdx = inner.LastIndexOf(" (", StringComparison.Ordinal);
        if (guidSepIdx <= 0)
            return (null, null);

        var namePart = inner[..guidSepIdx].Trim();
        var guidPart = inner[(guidSepIdx + 2)..].Trim();

        if (Guid.TryParse(guidPart, out var menuId) && menuId != Guid.Empty)
            return (menuId, string.IsNullOrWhiteSpace(namePart) ? null : namePart);

        return (null, null);
    }

    private static string AppendReason(string? existing, string addition)
        => string.IsNullOrWhiteSpace(existing) ? addition : $"{existing.Trim()} | {addition}";

    private static string TruncateReason(string reason)
        => reason.Length <= 500 ? reason : reason[..500];

    public static ReservationDetailDto MapToDetailDto(Reservation r)
    {
        var (preOrderedId, preOrderedName) = ParsePreOrderedSetMenu(r.Note);
        var guestDto = new GuestProfileDto(
            r.Guest?.Id ?? r.GuestId,
            r.Guest?.FullName ?? "N/A",
            r.Guest?.PhoneNumber ?? "N/A",
            r.Guest?.Email ?? string.Empty
        );
        var depositDto = r.Deposit != null
            ? new DepositDetailDto(
                r.Deposit.Id,
                r.Deposit.ReservationId,
                r.Deposit.Amount,
                r.Deposit.TransactionId ?? $"VNP-{r.BookingCode}",
                r.Deposit.PaymentMethod == PaymentMethod.Card ? "Card" : "VietQR",
                r.Deposit.Status,
                r.Deposit.PaidAt,
                r.Deposit.RefundAmount,
                r.Deposit.CreatedAt)
            : null;
        var holdExpiresAt = r.Status == ReservationStatus.Pending
            ? (DateTime?)r.CreatedAt.AddMinutes(LockDurationMinutes)
            : null;

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
            r.Deposit?.Status,
            r.Table?.Zone.ToString() ?? "MainHall",
            r.CreatedAt,
            preOrderedId,
            preOrderedName,
            guestDto,
            depositDto,
            r.DurationMinutes > 0 ? r.DurationMinutes : 120,
            r.CancelledAt,
            r.CancelledReason,
            holdExpiresAt,
            null,
            ReservationGuestStatus.From(r)
        );
    }
}
