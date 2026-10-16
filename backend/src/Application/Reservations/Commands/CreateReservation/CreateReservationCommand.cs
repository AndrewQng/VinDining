using MediatR;

namespace Application.Reservations.Commands.CreateReservation;

public record CreateReservationCommand(
    string FullName,
    string PhoneNumber,
    string Email,
    Guid TableId,
    DateTime ReservationTime,
    int PartySize,
    string? Note = null
) : IRequest<CreateReservationResultDto>;
