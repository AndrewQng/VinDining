using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Reservation : BaseEntity, IHasCreatedAt
{
    public string BookingCode { get; set; } = string.Empty;

    public Guid GuestId { get; set; }
    public Guest Guest { get; set; } = null!;

    public Guid TableId { get; set; }
    public Table Table { get; set; } = null!;

    public DateTime ReservationTime { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? Note { get; set; }
    public int PartySize { get; set; }
    public int DurationMinutes { get; set; } = 120;
    public DateTime? CancelledAt { get; set; }
    public string? CancelledReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Deposit? Deposit { get; set; }
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
}
