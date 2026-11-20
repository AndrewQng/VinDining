namespace API.Services;

public class RefundService : IRefundService
{
    public const string RefundRejectedMarker = "[REFUND_REJECTED]";

    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _paymentGateway;
    private readonly ITableNotifier? _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;

    public RefundService(
        IApplicationDbContext context,
        IPaymentGateway paymentGateway,
        ITableNotifier? tableNotifier = null,
        ITableConcurrencyLock? tableLock = null)
    {
        _context = context;
        _paymentGateway = paymentGateway;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? DefaultTableLock;
    }

    public async Task<bool> OverrideRefundAsync(Guid reservationId, ManualRefundDto dto, CancellationToken ct = default)
    {
        var effectiveNote = !string.IsNullOrWhiteSpace(dto.ApprovalNote)
            ? dto.ApprovalNote.Trim()
            : dto.Reason?.Trim() ?? string.Empty;
        var effectiveApproved = dto.Approved ?? dto.IsApproved;

        if (string.IsNullOrWhiteSpace(effectiveNote))
            throw new ArgumentException("Lý do phê duyệt hoặc từ chối hoàn cọc ngoại lệ không được để trống.");

        var reservation = await _context.Reservations
            .Include(r => r.Deposit)
            .Include(r => r.Table)
            .Include(r => r.Orders)
                .ThenInclude(o => o.Invoice)
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {reservationId}.");

        await using var lockHandle = await _tableLock.AcquireAsync(reservation.TableId, ct);

        if (reservation.Status == ReservationStatus.Completed)
            throw new InvalidOperationException("Đơn đặt bàn đã hoàn tất nhận bàn, không thể hoàn tiền cọc thủ công.");

        var hasSettledOrActiveOrder = reservation.Orders.Any(o =>
                o.Status == OrderStatus.Completed ||
                o.Status == OrderStatus.Processing ||
                o.Invoice != null)
            || await _context.Orders.AnyAsync(o =>
                o.ReservationId == reservation.Id &&
                (o.Status == OrderStatus.Completed || o.Status == OrderStatus.Processing || o.Invoice != null), ct);

        if (hasSettledOrActiveOrder)
            throw new InvalidOperationException("Đơn đặt bàn đã phát sinh đơn phục vụ hoặc đã cấn trừ tiền cọc vào hóa đơn thanh toán, không thể hoàn tiền cọc.");

        if (reservation.Deposit == null)
            throw new InvalidOperationException("Đơn đặt bàn này không có thông tin tiền cọc.");

        if (reservation.Deposit.Status == DepositStatus.Refunded)
            throw new InvalidOperationException("Tiền cọc của đơn đặt bàn này đã được hoàn trả trước đó.");

        if (reservation.Deposit.Status != DepositStatus.Forfeited && reservation.Deposit.Status != DepositStatus.Paid)
            throw new InvalidOperationException("Chỉ có thể xét duyệt hoàn cọc cho các giao dịch đã thanh toán hoặc đang bị phạt giữ cọc.");

        if (reservation.Deposit.Status == DepositStatus.Forfeited &&
            reservation.Deposit.PaidAt == null &&
            string.IsNullOrWhiteSpace(reservation.Deposit.TransactionId) &&
            IsUnpaidCancellationReason(reservation.CancelledReason))
        {
            throw new InvalidOperationException("Đơn đặt bàn này chưa thanh toán tiền cọc thành công, không thể hoàn tiền.");
        }

        var now = DateTime.UtcNow;

        if (!effectiveApproved)
        {
            if ((reservation.CancelledReason ?? string.Empty).Contains(RefundRejectedMarker, StringComparison.Ordinal))
                throw new InvalidOperationException("Yêu cầu hoàn cọc của đơn đặt bàn này đã bị từ chối trước đó.");

            reservation.Deposit.Status = DepositStatus.Forfeited;
            reservation.Deposit.RefundAmount = 0m;
            reservation.CancelledReason = TruncateReason(
                $"{reservation.CancelledReason ?? "Hủy muộn"} | {RefundRejectedMarker} Từ chối hoàn cọc: {effectiveNote}");

            TableStatus? rejectReleaseNotify = null;
            if (reservation.Status != ReservationStatus.Cancelled)
            {
                reservation.Status = ReservationStatus.Cancelled;
                reservation.CancelledAt ??= now;

                if (reservation.Table != null &&
                    (reservation.Table.Status == TableStatus.Reserved || reservation.Table.Status == TableStatus.LockedForPayment))
                {
                    var nextStatus = await ReservationService.ResolveSafeTableStatusAfterReleaseAsync(
                        _context,
                        reservation.Table,
                        new[] { reservation.Id },
                        now,
                        ct);

                    if (reservation.Table.Status != nextStatus)
                    {
                        reservation.Table.Status = nextStatus;
                        rejectReleaseNotify = nextStatus;
                    }
                }
            }

            await _context.SaveChangesAsync(ct);

            if (rejectReleaseNotify.HasValue && reservation.Table != null && _tableNotifier != null)
            {
                await _tableNotifier.NotifyTableStatusChangedAsync(
                    reservation.Table.Id,
                    reservation.Table.TableNumber,
                    rejectReleaseNotify.Value,
                    ct);
            }

            return true;
        }

        if (dto.RefundAmount < 0)
            throw new ArgumentException("Số tiền hoàn trả không được nhỏ hơn 0.");

        var refundAmount = dto.RefundAmount > 0 ? dto.RefundAmount : reservation.Deposit.Amount;
        if (refundAmount <= 0 || refundAmount > reservation.Deposit.Amount)
            throw new InvalidOperationException($"Số tiền hoàn trả ({refundAmount:N0} VNĐ) phải lớn hơn 0 và không vượt quá số tiền đã cọc ({reservation.Deposit.Amount:N0} VNĐ).");

        var txId = !string.IsNullOrWhiteSpace(reservation.Deposit.TransactionId)
            ? reservation.Deposit.TransactionId
            : $"TXN-{Guid.NewGuid():N}"[..16].ToUpperInvariant();

        var success = await _paymentGateway.RefundAsync(txId, refundAmount, effectiveNote, ct);
        if (!success)
            throw new InvalidOperationException("Không thể thực hiện lệnh hoàn tiền qua cổng thanh toán VNPAY.");

        reservation.Deposit.Status = DepositStatus.Refunded;
        reservation.Deposit.RefundAmount = refundAmount;
        reservation.CancelledReason = TruncateReason(
            $"{reservation.CancelledReason ?? "Hủy ngoại lệ"} | Duyệt hoàn cọc: {effectiveNote}");

        if (reservation.Status != ReservationStatus.Cancelled)
        {
            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt ??= now;
        }

        TableStatus? approveReleaseNotify = null;
        if (reservation.Table != null &&
            (reservation.Table.Status == TableStatus.Reserved || reservation.Table.Status == TableStatus.LockedForPayment))
        {
            var nextStatus = await ReservationService.ResolveSafeTableStatusAfterReleaseAsync(
                _context,
                reservation.Table,
                new[] { reservation.Id },
                now,
                ct);

            if (reservation.Table.Status != nextStatus)
            {
                reservation.Table.Status = nextStatus;
                approveReleaseNotify = nextStatus;
            }
        }

        await _context.SaveChangesAsync(ct);

        if (approveReleaseNotify.HasValue && reservation.Table != null && _tableNotifier != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(
                reservation.Table.Id,
                reservation.Table.TableNumber,
                approveReleaseNotify.Value,
                ct);
        }

        return true;
    }

    public Task<List<RefundRequestDto>> GetRefundRequestsAsync(CancellationToken ct = default)
        => GetRefundRequestsAsync(includeProcessed: false, ct);

    public async Task<List<RefundRequestDto>> GetRefundRequestsAsync(bool includeProcessed, CancellationToken ct = default)
    {
        var reservations = await _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .Include(r => r.Orders)
                .ThenInclude(o => o.Invoice)
            .Where(r => r.Status == ReservationStatus.Cancelled &&
                        r.Deposit != null &&
                        (includeProcessed
                            ? (r.Deposit.Status == DepositStatus.Forfeited || r.Deposit.Status == DepositStatus.Paid || r.Deposit.Status == DepositStatus.Refunded)
                            : (r.Deposit.Status == DepositStatus.Forfeited || r.Deposit.Status == DepositStatus.Paid)) &&
                        !r.Orders.Any(o => o.Status == OrderStatus.Completed || o.Status == OrderStatus.Processing || o.Invoice != null))
            .OrderByDescending(r => r.CancelledAt ?? r.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return reservations
            .Where(r =>
            {
                var isUnpaid = r.Deposit!.Status == DepositStatus.Forfeited &&
                               r.Deposit.PaidAt == null &&
                               (string.IsNullOrWhiteSpace(r.Deposit.TransactionId) || IsUnpaidCancellationReason(r.CancelledReason));
                if (isUnpaid)
                    return false;

                var isRejected = (r.CancelledReason ?? string.Empty).Contains(RefundRejectedMarker, StringComparison.Ordinal);
                if (!includeProcessed)
                    return !isRejected;

                if (r.Deposit.Status == DepositStatus.Refunded)
                {
                    var requestedAt = r.CancelledAt ?? r.CreatedAt;
                    var hours = (r.ReservationTime - requestedAt).TotalHours;
                    var reasonText = r.CancelledReason ?? string.Empty;
                    return hours < 4.0 ||
                           reasonText.Contains("Duyệt hoàn cọc:", StringComparison.OrdinalIgnoreCase) ||
                           reasonText.Contains("ngoại lệ", StringComparison.OrdinalIgnoreCase);
                }

                return true;
            })
            .Select(r =>
            {
                var requestedAt = r.CancelledAt ?? r.CreatedAt;
                var hours = Math.Max(0.0, Math.Round((r.ReservationTime - requestedAt).TotalHours, 1));
                var isRejected = (r.CancelledReason ?? string.Empty).Contains(RefundRejectedMarker, StringComparison.Ordinal);
                var isManualApproved = r.Deposit!.Status == DepositStatus.Refunded;

                string? decisionAction = null;
                string? auditReason = null;
                DateTime? processedAt = null;

                if (includeProcessed && isManualApproved)
                {
                    decisionAction = "ManualRefundApproved";
                    auditReason = ExtractAuditReason(r.CancelledReason, "Duyệt hoàn cọc:");
                    processedAt = requestedAt;
                }
                else if (includeProcessed && isRejected)
                {
                    decisionAction = "ManualRefundRejected";
                    auditReason = ExtractAuditReason(r.CancelledReason, "Từ chối hoàn cọc:");
                    processedAt = requestedAt;
                }

                return new RefundRequestDto(
                    r.Id,
                    r.BookingCode,
                    r.Guest?.FullName ?? "N/A",
                    r.Deposit?.Amount ?? 0m,
                    r.CancelledReason ?? r.Note ?? "Hủy đặt bàn dưới 4 tiếng / vắng mặt",
                    r.Status.ToString(),
                    r.Deposit?.Status.ToString() ?? "Forfeited",
                    r.CancelledAt,
                    ReservationService.MapToDetailDto(r),
                    hours,
                    requestedAt,
                    auditReason,
                    processedAt,
                    decisionAction
                );
            }).ToList();
    }

    private static string? ExtractAuditReason(string? cancelledReason, string prefix)
    {
        if (string.IsNullOrWhiteSpace(cancelledReason))
            return null;

        var idx = cancelledReason.LastIndexOf(prefix, StringComparison.OrdinalIgnoreCase);
        if (idx >= 0)
        {
            var extracted = cancelledReason[(idx + prefix.Length)..].Trim();
            return string.IsNullOrWhiteSpace(extracted) ? null : extracted;
        }

        var pipeIdx = cancelledReason.LastIndexOf('|');
        if (pipeIdx >= 0 && pipeIdx + 1 < cancelledReason.Length)
        {
            var trailing = cancelledReason[(pipeIdx + 1)..].Replace(RefundRejectedMarker, string.Empty, StringComparison.Ordinal).Trim();
            return string.IsNullOrWhiteSpace(trailing) ? null : trailing;
        }

        return cancelledReason;
    }

    private static bool IsUnpaidCancellationReason(string? cancelledReason)
    {
        if (string.IsNullOrWhiteSpace(cancelledReason))
            return false;

        return cancelledReason.Contains("quá thời hạn thanh toán tiền cọc", StringComparison.OrdinalIgnoreCase) ||
               cancelledReason.Contains("Thanh toán cọc VNPAY không thành công", StringComparison.OrdinalIgnoreCase) ||
               cancelledReason.Contains(ReservationService.UnpaidCancellationMarker, StringComparison.OrdinalIgnoreCase);
    }

    private static string TruncateReason(string reason)
        => reason.Length <= 500 ? reason : reason[..500];
}
