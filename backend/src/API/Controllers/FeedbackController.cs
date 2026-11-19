using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/feedbacks")]
[Authorize]
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
        var list = await _feedbackService.GetFeedbacksAsync(ct);
        var created = list.FirstOrDefault(f => f.Id == feedbackId);
        return StatusCode(StatusCodes.Status201Created, new
        {
            feedbackId,
            id = feedbackId,
            reservationId = created?.ReservationId,
            invoiceId = created?.InvoiceId ?? dto.InvoiceId,
            guestName = created?.GuestName,
            tableNumber = created?.TableNumber,
            rating = created?.Rating ?? dto.Rating,
            foodRating = dto.FoodRating ?? created?.FoodRating ?? dto.Rating,
            ambienceRating = dto.AmbienceRating ?? created?.AmbienceRating ?? dto.Rating,
            serviceRating = dto.ServiceRating ?? created?.ServiceRating ?? dto.Rating,
            comment = created?.Comment ?? dto.Comment,
            createdAt = created?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpGet]
    [HttpGet("/api/manager/feedbacks")]
    [HttpGet("/api/admin/feedbacks")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetFeedbacksAsync(CancellationToken ct)
    {
        var result = await _feedbackService.GetFeedbacksAsync(ct);
        return Ok(result);
    }
}
