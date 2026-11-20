namespace API.Services.Interfaces;

public interface IFeedbackService
{
    Task<FeedbackTokenValidationDto> ValidateSurveyTokenAsync(string token, CancellationToken ct = default);
    Task<Guid> SubmitFeedbackAsync(SubmitFeedbackDto dto, CancellationToken ct = default);
    Task<List<FeedbackDto>> GetFeedbacksAsync(CancellationToken ct = default);
}
