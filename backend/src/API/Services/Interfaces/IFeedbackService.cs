namespace API.Services.Interfaces;

public interface IFeedbackService
{
    Task<Guid> SubmitFeedbackAsync(SubmitFeedbackDto dto, CancellationToken ct = default);
    Task<List<FeedbackDto>> GetFeedbacksAsync(CancellationToken ct = default);
}
