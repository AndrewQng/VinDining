namespace Application.Reservations.Queries.GetReservationByCode;

public class ReservationDetailDto
{
    public Guid Id { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public Guid TableId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public string TableZone { get; set; } = string.Empty;
    public DateTime ReservationTime { get; set; }
    public int PartySize { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public decimal? DepositAmount { get; set; }
    public string? DepositStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}
