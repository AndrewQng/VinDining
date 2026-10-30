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
        // Tra cứu reservation từ invoice nếu có
        var invoice = await _context.Invoices
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId, ct);

        var reservationId = invoice?.Order?.ReservationId ?? Guid.Empty;

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            ReservationId = reservationId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Feedbacks.AddAsync(feedback, ct);
        await _context.SaveChangesAsync(ct);
        return feedback.Id;
    }

    public async Task<List<FeedbackDto>> GetFeedbacksAsync(CancellationToken ct = default)
    {
        var list = await _context.Feedbacks.AsNoTracking().OrderByDescending(f => f.CreatedAt).ToListAsync(ct);
        return list.Select(f => new FeedbackDto(f.Id, f.ReservationId, (int)f.Rating, f.Comment, f.CreatedAt)).ToList();
    }
}
