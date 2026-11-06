using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/feedbacks")]
public class FeedbackController : ApiControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitFeedbackAsync([FromBody] SubmitFeedbackDto dto, CancellationToken ct)
    {
        var feedbackId = await _feedbackService.SubmitFeedbackAsync(dto, ct);
        return StatusCode(StatusCodes.Status201Created, new { feedbackId, id = feedbackId });
    }

    [HttpGet]
    public async Task<IActionResult> GetFeedbacksAsync(CancellationToken ct)
    {
        var result = await _feedbackService.GetFeedbacksAsync(ct);
        return Ok(result);
    }
}
