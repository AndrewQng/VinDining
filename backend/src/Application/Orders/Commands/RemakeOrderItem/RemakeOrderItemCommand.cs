using MediatR;

namespace Application.Orders.Commands.RemakeOrderItem;

public record RemakeOrderItemCommand(
    Guid OrderId,
    Guid OrderItemId,
    string? Reason = null,
    Guid? StaffId = null
) : IRequest<bool>;
