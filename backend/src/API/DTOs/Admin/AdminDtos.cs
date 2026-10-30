namespace API.DTOs;

public record UpdateFloorPlanDto(
    List<TablePositionDto> Tables
);

public record TablePositionDto(
    Guid TableId,
    int PosX,
    int PosY
);

public record CreateTableDto(
    string TableNumber,
    int Capacity,
    TableZone Zone,
    int PosX = 0,
    int PosY = 0
);

public record ManualRefundDto(
    string ApprovalNote,
    decimal RefundAmount
);

public record RefundRequestDto(
    Guid ReservationId,
    string BookingCode,
    string GuestName,
    decimal DepositAmount,
    string Reason,
    string Status
);
