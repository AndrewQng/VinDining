using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Table : BaseEntity, IHasCreatedAt
{
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableZone Zone { get; set; } = TableZone.MainHall;
    public TableStatus Status { get; set; } = TableStatus.Available;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
