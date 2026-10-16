using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Invoice : BaseEntity, IHasCreatedAt
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid SettleById { get; set; }
    public Staff SettleBy { get; set; } = null!;

    public decimal Subtotal { get; set; }
    public decimal ServiceCharge { get; set; }
    public decimal VatAmount { get; set; }
    public decimal DeductedDeposit { get; set; }
    public decimal TotalAmount => Subtotal + ServiceCharge + VatAmount - DeductedDeposit;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public bool IsPaid { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
