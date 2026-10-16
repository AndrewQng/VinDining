using Domain.Enums;

namespace Application.Reservations.Queries.GetAvailableTables;

public class AvailableTableDto
{
    public Guid Id { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableZone Zone { get; set; }
    public string ZoneName => Zone.ToString();
    public TableStatus Status { get; set; }
}
