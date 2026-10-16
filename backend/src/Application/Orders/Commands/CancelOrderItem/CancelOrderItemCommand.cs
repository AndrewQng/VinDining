using MediatR;

namespace Application.Orders.Commands.CancelOrderItem;

public record CancelOrderItemCommand(
    Guid OrderId,
    Guid OrderItemId,
    string? Reason = null
) : IRequest<bool>;
