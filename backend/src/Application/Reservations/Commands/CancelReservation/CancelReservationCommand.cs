using MediatR;

namespace Application.Reservations.Commands.CancelReservation;

public record CancelReservationCommand(
    string BookingCode,
    string? Reason = null
) : IRequest<CancelReservationResultDto>;
