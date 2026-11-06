namespace API.Services;

public class RefundService : IRefundService
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _paymentGateway;

    public RefundService(IApplicationDbContext context, IPaymentGateway paymentGateway)
    {
        _context = context;
        _paymentGateway = paymentGateway;
    }

    public async Task<bool> OverrideRefundAsync(Guid reservationId, ManualRefundDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.ApprovalNote))
            throw new ArgumentException("Lý do phê duyệt hoặc từ chối hoàn cọc ngoại lệ không được để trống.");

        var reservation = await _context.Reservations
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {reservationId}.");

        if (reservation.Deposit == null)
            throw new InvalidOperationException("Đơn đặt bàn này không có thông tin tiền cọc.");

        if (reservation.Deposit.Status == DepositStatus.Refunded)
            throw new InvalidOperationException("Tiền cọc của đơn đặt bàn này đã được hoàn trả trước đó.");

        if (reservation.Deposit.Status != DepositStatus.Forfeited && reservation.Deposit.Status != DepositStatus.Paid)
            throw new InvalidOperationException("Chỉ có thể xét duyệt hoàn cọc cho các giao dịch đã thanh toán hoặc đang bị phạt giữ cọc.");

        if (!dto.IsApproved)
        {
            reservation.Deposit.Status = DepositStatus.Forfeited;
            reservation.Deposit.RefundAmount = 0m;
            reservation.CancelledReason = $"{reservation.CancelledReason ?? "Hủy muộn"} | Từ chối hoàn cọc: {dto.ApprovalNote.Trim()}";
            await _context.SaveChangesAsync(ct);
            return true;
        }

        var refundAmount = dto.RefundAmount > 0 ? dto.RefundAmount : reservation.Deposit.Amount;
        if (refundAmount <= 0 || refundAmount > reservation.Deposit.Amount)
            throw new InvalidOperationException($"Số tiền hoàn trả ({refundAmount:N0} VNĐ) phải lớn hơn 0 và không vượt quá số tiền đã cọc ({reservation.Deposit.Amount:N0} VNĐ).");

        var txId = reservation.Deposit.TransactionId ?? Guid.NewGuid().ToString("N");
        var success = await _paymentGateway.RefundAsync(txId, refundAmount, dto.ApprovalNote.Trim(), ct);
        if (!success)
            throw new InvalidOperationException("Không thể thực hiện lệnh hoàn tiền qua cổng thanh toán VNPAY.");

        reservation.Deposit.Status = DepositStatus.Refunded;
        reservation.Deposit.RefundAmount = refundAmount;
        reservation.CancelledReason = $"{reservation.CancelledReason ?? "Hủy ngoại lệ"} | Duyệt hoàn cọc: {dto.ApprovalNote.Trim()}";

        if (reservation.Status != ReservationStatus.Cancelled)
        {
            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<RefundRequestDto>> GetRefundRequestsAsync(CancellationToken ct = default)
    {
        var reservations = await _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Deposit)
            .Where(r => r.Status == ReservationStatus.Cancelled &&
                        r.Deposit != null &&
                        (r.Deposit.Status == DepositStatus.Forfeited || r.Deposit.Status == DepositStatus.Paid))
            .OrderByDescending(r => r.CancelledAt ?? r.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);

        return reservations.Select(r => new RefundRequestDto(
            r.Id,
            r.BookingCode,
            r.Guest?.FullName ?? "N/A",
            r.Deposit?.Amount ?? 0m,
            r.CancelledReason ?? r.Note ?? "Hủy đặt bàn dưới 4 tiếng / vắng mặt",
            r.Status.ToString(),
            r.Deposit?.Status.ToString() ?? "Forfeited",
            r.CancelledAt
        )).ToList();
    }
}
