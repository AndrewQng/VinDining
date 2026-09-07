using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Reservation : BaseEntity
{
    public Guid GuestId { get; set; }
    public Guest Guest { get; set; } = null!;

    public Guid TableId { get; set; }
    public Table Table { get; set; } = null!;

    public DateTime ReservationTime { get; set; }
    public int PartySize { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.AwaitingPayment;
    public string? Note { get; set; }

    public Deposit? Deposit { get; set; }
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
