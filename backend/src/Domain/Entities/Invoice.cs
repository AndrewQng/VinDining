using Domain.Common;

namespace Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public decimal Subtotal { get; set; }
    public decimal ServiceCharge { get; set; }
    public decimal VatAmount { get; set; }
    public decimal DeductedDeposit { get; set; }
    public decimal AmountPayable { get; set; }
    
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public bool IsPaid { get; set; }
}
