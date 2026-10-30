using API.Models.Common;

namespace API.Models.Entities;

public class Feedback : BaseEntity, IHasCreatedAt
{
    public Guid ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;

    public double Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
