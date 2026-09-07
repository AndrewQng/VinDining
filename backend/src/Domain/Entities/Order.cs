using Domain.Common;

namespace Domain.Entities;

public class Order : BaseEntity
{
    public Guid TableId { get; set; }
    public Table Table { get; set; } = null!;

    public Guid? ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public Invoice? Invoice { get; set; }
}
