using Domain.Common;

namespace Domain.Entities;

public class Guest : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
