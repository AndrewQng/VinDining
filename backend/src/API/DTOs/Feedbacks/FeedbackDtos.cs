namespace API.DTOs;

public record SubmitFeedbackDto(
    Guid InvoiceId,
    int Rating,
    string? Comment = null
);

public record FeedbackDto(
    Guid Id,
    Guid InvoiceId,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);
