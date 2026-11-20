namespace API.DTOs;

public record UpdateFloorPlanDto(
    List<TablePositionDto>? Tables = null,
    List<TablePositionDto>? Positions = null
);

public record TablePositionDto(
    Guid TableId,
    int PosX,
    int PosY,
    int? Capacity = null,
    TableZone? Zone = null,
    string? TableNumber = null
);

public record CreateTableDto(
    string TableNumber,
    int Capacity,
    TableZone Zone,
    int PosX = 0,
    int PosY = 0
);

public record ManualRefundDto(
    string ApprovalNote = "",
    decimal RefundAmount = 0m,
    bool IsApproved = true,
    bool? Approved = null,
    string? Reason = null
);

public record RefundRequestDto(
    Guid ReservationId,
    string BookingCode,
    string GuestName,
    decimal DepositAmount,
    string Reason,
    string Status,
    string DepositStatus = "Forfeited",
    DateTime? CancelledAt = null,
    ReservationDetailDto? Reservation = null,
    double HoursBeforeReservation = 0.0,
    DateTime RequestedAt = default,
    string? AuditReason = null,
    DateTime? ProcessedAt = null,
    string? DecisionAction = null
);
