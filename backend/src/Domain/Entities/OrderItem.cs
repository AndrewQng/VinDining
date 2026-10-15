using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid? MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    public Guid? TastingMenuId { get; set; }
    public TastingMenu? TastingMenu { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public OrderItemStatus Status { get; set; } = OrderItemStatus.Hold;
    public string? Note { get; set; }
    public DateTime? FiredAt { get; set; }
    public Guid? ServedById { get; set; }
    public Staff? ServedBy { get; set; }
    public DateTime? ServedAt { get; set; }
}
