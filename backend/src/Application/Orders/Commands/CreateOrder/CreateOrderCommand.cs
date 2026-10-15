using MediatR;

namespace Application.Orders.Commands.CreateOrder;

public record CreateOrderItemDto(
    Guid MenuItemId,
    int Quantity,
    string? Note
);

public record CreateOrderCommand(
    Guid TableId,
    Guid? ReservationId,
    Guid? StaffId,
    List<CreateOrderItemDto> Items
) : IRequest<Guid>;
