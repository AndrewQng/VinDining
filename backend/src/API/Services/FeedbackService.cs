using API.Models.Common;

namespace API.Services;

public class FeedbackService : IFeedbackService
{
    private readonly IApplicationDbContext _context;

    public FeedbackService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> SubmitFeedbackAsync(SubmitFeedbackDto dto, CancellationToken ct = default)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            throw new ArgumentException("Điểm đánh giá dịch vụ phải nằm trong khoảng từ 1 đến 5 sao.");

        Guid? reservationId = dto.ReservationId;

        if (!reservationId.HasValue || reservationId.Value == Guid.Empty)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Order)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId, ct);

            if (invoice != null)
            {
                reservationId = invoice.Order?.ReservationId;
            }
            else if (dto.InvoiceId != Guid.Empty && await _context.Reservations.AnyAsync(r => r.Id == dto.InvoiceId, ct))
            {
                reservationId = dto.InvoiceId;
            }
        }

        if (!reservationId.HasValue || reservationId.Value == Guid.Empty)
            throw new InvalidOperationException("Không tìm thấy phiên đặt bàn hợp lệ liên kết với hóa đơn để ghi nhận đánh giá.");

        var reservationExists = await _context.Reservations.AnyAsync(r => r.Id == reservationId.Value, ct);
        if (!reservationExists)
            throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {reservationId.Value}.");

        var duplicate = await _context.Feedbacks.AnyAsync(f => f.ReservationId == reservationId.Value, ct);
        if (duplicate)
            throw new ConflictException("Phiên dùng bữa này đã được gửi đánh giá trước đó.");

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            ReservationId = reservationId.Value,
            Rating = dto.Rating,
            Comment = dto.Comment?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Feedbacks.AddAsync(feedback, ct);
        await _context.SaveChangesAsync(ct);
        return feedback.Id;
    }

    public async Task<List<FeedbackDto>> GetFeedbacksAsync(CancellationToken ct = default)
    {
        var list = await _context.Feedbacks
            .AsNoTracking()
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

        return list.Select(f => new FeedbackDto(
            f.Id,
            f.ReservationId,
            (int)Math.Round(f.Rating),
            f.Comment,
            f.CreatedAt,
            f.ReservationId
        )).ToList();
    }
}
