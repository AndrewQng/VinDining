namespace Application.Reservations.Commands.CreateReservation;

public class CreateReservationResultDto
{
    public Guid ReservationId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public string TableNumber { get; set; } = string.Empty;
    public decimal DepositAmount { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
