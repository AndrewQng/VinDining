namespace API.DTOs;

public record SubmitFeedbackDto(
    Guid InvoiceId = default,
    int Rating = 0,
    string? Comment = null,
    Guid? ReservationId = null,
    string? Token = null,
    int? FoodRating = null,
    int? AmbienceRating = null,
    int? ServiceRating = null
);

public record FeedbackDto(
    Guid Id,
    Guid InvoiceId,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    Guid ReservationId = default,
    string? GuestName = null,
    string? TableNumber = null,
    int? FoodRating = null,
    int? AmbienceRating = null,
    int? ServiceRating = null
)
{
    public int EffectiveFoodRating => FoodRating ?? Rating;
    public int EffectiveAmbienceRating => AmbienceRating ?? Rating;
    public int EffectiveServiceRating => ServiceRating ?? Rating;
}
