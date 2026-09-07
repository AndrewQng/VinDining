using Domain.Common;

namespace Domain.Entities;

public class Deposit : BaseEntity
{
    public Guid ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;

    public decimal Amount { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "VNPAY";
    public DateTime PaymentTime { get; set; }
}
