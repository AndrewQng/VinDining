namespace API.DTOs;

public record CreateReservationDto(
    string FullName,
    string PhoneNumber,
    string Email,
    Guid TableId,
    DateTime ReservationTime,
    int PartySize,
    string? Note = null,
    Guid? TastingMenuId = null
);

public record CreateReservationResultDto(
    Guid ReservationId,
    string BookingCode,
    decimal DepositAmount,
    string PaymentUrl,
    DateTime ExpireAt,
    string TableNumber = ""
)
{
    public DateTime ExpiresAt => ExpireAt;
}

public record AvailableTableDto(
    Guid Id,
    string TableNumber,
    int Capacity,
    TableZone Zone,
    TableStatus Status
)
{
    public string ZoneName => Zone.ToString();
}

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
    DateTime CreatedAt = default
)
{
    public string GuestPhone => PhoneNumber;
    public string GuestEmail => Email ?? string.Empty;
}

public record CancelReservationDto(
    string BookingCode,
    string Reason = "Khách hàng yêu cầu hủy"
);

public record CancelReservationBodyDto(
    string Reason = "Khách hàng yêu cầu hủy"
);

public record CancelReservationResultDto(
    bool Success,
    string BookingCode,
    string Status,
    bool IsRefunded,
    decimal RefundAmount,
    string Message
);

public record ConfirmDepositDto(
    string BookingCode,
    string TransactionId,
    PaymentMethod PaymentMethod = PaymentMethod.BankTransfer
);

public record NoShowReservationDto(
    string? Reason = "Khách không đến sau thời gian giữ chỗ 15 phút"
);

public record VnPayIpnDto(
    string? vnp_TxnRef,
    string? vnp_Amount,
    string? vnp_ResponseCode,
    string? vnp_TransactionNo,
    string? vnp_BankCode,
    string? vnp_SecureHash
);
