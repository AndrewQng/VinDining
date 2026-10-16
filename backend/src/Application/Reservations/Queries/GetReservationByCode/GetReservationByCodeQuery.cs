using MediatR;

namespace Application.Reservations.Queries.GetReservationByCode;

public record GetReservationByCodeQuery(string BookingCode) : IRequest<ReservationDetailDto>;
