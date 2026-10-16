using MediatR;

namespace Application.Orders.Commands.ServeOrderItem;

public record ServeOrderItemCommand(
    Guid OrderId,
    Guid OrderItemId,
    Guid? ServedById = null
) : IRequest<bool>;
