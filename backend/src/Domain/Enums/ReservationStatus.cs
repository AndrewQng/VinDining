namespace Domain.Enums;

public enum ReservationStatus
{
    AwaitingPayment = 0,
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3,
    Expired = 4,
    Expired_AutoRefunded = 5
}
