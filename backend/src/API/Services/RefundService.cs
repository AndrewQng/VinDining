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
        var reservation = await _context.Reservations
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.Id == reservationId, ct);

        if (reservation == null) throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {reservationId}.");

        if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Paid)
        {
            var txId = reservation.Deposit.TransactionId ?? Guid.NewGuid().ToString();
            var success = await _paymentGateway.RefundAsync(txId, dto.RefundAmount, dto.ApprovalNote, ct);
            if (success)
            {
                reservation.Deposit.Status = DepositStatus.Refunded;
                reservation.Deposit.RefundAmount = dto.RefundAmount;
                await _context.SaveChangesAsync(ct);
                return true;
            }
        }
        return false;
    }

    public async Task<List<RefundRequestDto>> GetRefundRequestsAsync(CancellationToken ct = default)
    {
        var reservations = await _context.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Deposit)
            .Where(r => r.Status == ReservationStatus.Cancelled && r.Deposit != null && r.Deposit.Status == DepositStatus.Paid)
            .AsNoTracking()
            .ToListAsync(ct);

        return reservations.Select(r => new RefundRequestDto(
            r.Id,
            r.BookingCode,
            r.Guest?.FullName ?? "N/A",
            r.Deposit?.Amount ?? 0m,
            r.Note ?? "Hủy đặt bàn",
            r.Status.ToString()
        )).ToList();
    }
}
