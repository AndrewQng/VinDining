namespace API.DTOs;

public record TableDto(
    Guid Id,
    string TableNumber,
    int Capacity,
    TableZone Zone,
    TableStatus Status,
    int PosX = 0,
    int PosY = 0,
    Guid? CurrentOrderId = null,
    bool IsActive = true,
    string? QrCode = null,
    Guid? AssignedStaffId = null,
    string? AssignedStaffName = null,
    string? CurrentReservationCode = null,
    int? GuestCount = null,
    DateTime? HoldExpiresAt = null,
    DateTime? CheckoutRequestedAt = null
)
{
    public int PositionX => PosX;
    public int PositionY => PosY;
    public string QrMenuUrl => $"/emenu/{Id}";
}

public record CheckInDto(
    string? BookingCode = null,
    Guid? ReservationId = null,
    string? ReservationCode = null
);

public record WalkInDto(
    string GuestName = "",
    string PhoneNumber = "",
    int PartySize = 2,
    string? Note = null,
    int? GuestCount = null
);

public record TransferTableDto(
    Guid TargetTableId,
    string? Reason = null
);

public record MergeTablesDto(
    List<Guid> TableIds,
    Guid PrimaryTableId,
    string? Reason = null
);

public record UpdateTableStatusDto(
    TableStatus Status
);

public record UpdateTableDto(
    string TableNumber,
    int Capacity,
    TableZone Zone,
    int PosX = 0,
    int PosY = 0,
    bool IsActive = true
);
