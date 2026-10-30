namespace API.DTOs;

public record CreateReservationDto(
    string FullName,
    string PhoneNumber,
    string Email,
    Guid TableId,
    DateTime ReservationTime,
    int PartySize,
    string? Note = null
);

public record CreateReservationResultDto(
    Guid ReservationId,
    string BookingCode,
    decimal DepositAmount,
    string PaymentUrl,
    DateTime ExpireAt
);

public record AvailableTableDto(
    Guid Id,
    string TableNumber,
    int Capacity,
    TableZone Zone,
    TableStatus Status
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
    DepositStatus? DepositStatus
);

public record CancelReservationDto(
    string BookingCode,
    string Reason
);

public record VnPayIpnDto(
    string? vnp_TxnRef,
    string? vnp_Amount,
    string? vnp_ResponseCode,
    string? vnp_TransactionNo,
    string? vnp_BankCode,
    string? vnp_SecureHash
);
