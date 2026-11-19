namespace API.DTOs;

public record CreateReservationDto(
    string FullName,
    string PhoneNumber,
    string Email,
    Guid TableId,
    DateTime ReservationTime,
    int PartySize,
    string? Note = null,
    Guid? TastingMenuId = null,
    Guid? PreOrderedTastingMenuId = null,
    string? PaymentMethod = null
);

public record CreateReservationResultDto(
    Guid ReservationId,
    string BookingCode,
    decimal DepositAmount,
    string PaymentUrl,
    DateTime ExpireAt,
    string TableNumber = "",
    Guid? PreOrderedTastingMenuId = null,
    string? PreOrderedTastingMenuName = null,
    ReservationDetailDto? Reservation = null
)
{
    public DateTime ExpiresAt => ExpireAt;
    public DateTime HoldExpiresAt => ExpireAt;
}

public record AvailableTableDto(
    Guid Id,
    string TableNumber,
    int Capacity,
    TableZone Zone,
    TableStatus Status,
    int PosX = 0,
    int PosY = 0
)
{
    public string ZoneName => Zone.ToString();
}

public record SlotTableAvailabilityDto(
    Guid Id,
    string TableNumber,
    int Capacity,
    TableZone Zone,
    string Availability,
    int PosX,
    int PosY,
    bool IsSelectable
);

public record AvailableSlotGroupDto(
    string Time,
    List<AvailableTableDto> AvailableTables,
    List<SlotTableAvailabilityDto> ZoneTables
);

public record GuestProfileDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string Email
);

public record DepositDetailDto(
    Guid Id,
    Guid ReservationId,
    decimal Amount,
    string TransactionId,
    string PaymentMethod,
    DepositStatus Status,
    DateTime? PaidAt,
    decimal? RefundAmount,
    DateTime CreatedAt
);

public record ReservationDetailDto(
    Guid Id,
    string BookingCode,
    string GuestName,
    string PhoneNumber,
    string? Email,
    Guid TableId,
    string TableNumber,
    DateTime ReservationTime,
    int PartySize,
    ReservationStatus Status,
    string? Note,
    decimal? DepositAmount,
    DepositStatus? DepositStatus,
    string TableZone = "MainHall",
    DateTime CreatedAt = default,
    Guid? PreOrderedTastingMenuId = null,
    string? PreOrderedTastingMenuName = null,
    GuestProfileDto? Guest = null,
    DepositDetailDto? Deposit = null,
    int DurationMinutes = 120,
    DateTime? CancelledAt = null,
    string? CancelledReason = null,
    DateTime? HoldExpiresAt = null,
    DateTime? ReminderSentAt = null
)
{
    public string GuestPhone => PhoneNumber;
    public string GuestEmail => Email ?? string.Empty;
    public string Zone => TableZone;
}

public record CancelReservationDto(
    string BookingCode,
    string Reason = "Khách hàng yêu cầu hủy",
    string? PhoneNumber = null,
    bool? ConfirmForfeit = null
);

public record CancelReservationBodyDto(
    string Reason = "Khách hàng yêu cầu hủy",
    string? PhoneNumber = null,
    bool? ConfirmForfeit = null
);

public record CancelReservationResultDto(
    bool Success,
    string BookingCode,
    string Status,
    bool IsRefunded,
    decimal RefundAmount,
    string Message,
    ReservationDetailDto? Reservation = null
)
{
    public bool Refunded => IsRefunded;
}

public record ConfirmDepositDto(
    string BookingCode,
    string TransactionId,
    PaymentMethod PaymentMethod = PaymentMethod.BankTransfer
);

public record NoShowReservationDto(
    string? Reason = "Khách không đến sau thời gian giữ chỗ 15 phút"
);

public record VnPayIpnDto(
    string? vnp_TxnRef = null,
    string? vnp_Amount = null,
    string? vnp_ResponseCode = null,
    string? vnp_TransactionNo = null,
    string? vnp_BankCode = null,
    string? vnp_SecureHash = null,
    string? BookingCode = null,
    string? TransactionId = null,
    string? PaymentMethod = null,
    string? ResponseCode = null
);

public record VnPayIpnProcessResultDto(
    bool Success,
    string RspCode,
    string Message,
    bool IsPaid = false,
    bool IsAutoRefunded = false
);
