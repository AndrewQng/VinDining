using API.Models.Common;
using API.Models.Enums;

namespace API.Models.Entities;

public class Deposit : BaseEntity, IHasCreatedAt
{
    public Guid ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;

    public decimal Amount { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public DepositStatus Status { get; set; } = DepositStatus.Pending;
    public DateTime? PaidAt { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
