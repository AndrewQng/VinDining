using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Table : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Zone { get; set; } = string.Empty;
    public TableStatus Status { get; set; } = TableStatus.Available;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
