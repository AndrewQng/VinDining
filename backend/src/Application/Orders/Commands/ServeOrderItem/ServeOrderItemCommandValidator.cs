using FluentValidation;

namespace Application.Orders.Commands.ServeOrderItem;

public class ServeOrderItemCommandValidator : AbstractValidator<ServeOrderItemCommand>
{
    public ServeOrderItemCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Mã đơn hàng không được để trống.");

        RuleFor(x => x.OrderItemId)
            .NotEmpty().WithMessage("Mã món trong đơn không được để trống.");
    }
}
