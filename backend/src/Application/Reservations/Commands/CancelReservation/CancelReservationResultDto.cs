namespace Application.Reservations.Commands.CancelReservation;

public class CancelReservationResultDto
{
    public string BookingCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsRefunded { get; set; }
    public decimal RefundAmount { get; set; }
    public string Message { get; set; } = string.Empty;
}
