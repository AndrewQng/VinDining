using API.Models.Common;
using API.Models.Enums;

namespace API.Models.Entities;

public class Table : BaseEntity, IHasCreatedAt
{
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableZone Zone { get; set; } = TableZone.MainHall;
    public TableStatus Status { get; set; } = TableStatus.Available;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public int PosX { get; set; } = 0;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public int PosY { get; set; } = 0;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
