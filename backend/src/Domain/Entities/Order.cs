using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Order : BaseEntity
{
    public Guid TableId { get; set; }
    public Table Table { get; set; } = null!;

    public Guid? ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    public Guid CreateById { get; set; }
    public Staff CreateBy { get; set; } = null!;

    public OrderStatus Status { get; set; } = OrderStatus.Processing;
    public bool IsPriority { get; set; } = false;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public Invoice? Invoice { get; set; }
}
