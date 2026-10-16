using Domain.Enums;
using MediatR;

namespace Application.Reservations.Queries.GetAvailableTables;

public record GetAvailableTablesQuery(
    DateTime ReservationTime,
    int PartySize,
    TableZone? Zone = null
) : IRequest<List<AvailableTableDto>>;
