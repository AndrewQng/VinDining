namespace API.DTOs;

public record ServiceCallDto(
    Guid TableId = default,
    string RequestType = "",
    string? Note = null
);

public record ServiceCallResponseDto(
    Guid Id,
    Guid TableId,
    string TableNumber,
    string RequestType,
    string Status,
    DateTime CreatedAt,
    Guid? CompletedById = null,
    DateTime? CompletedAt = null
);
