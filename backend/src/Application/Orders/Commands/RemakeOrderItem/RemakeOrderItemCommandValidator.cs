using FluentValidation;

namespace Application.Orders.Commands.RemakeOrderItem;

public class RemakeOrderItemCommandValidator : AbstractValidator<RemakeOrderItemCommand>
{
    public RemakeOrderItemCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Mã đơn hàng không được để trống.");

        RuleFor(x => x.OrderItemId)
            .NotEmpty().WithMessage("Mã món trong đơn không được để trống.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Lý do làm lại không vượt quá 500 ký tự.");
    }
}
