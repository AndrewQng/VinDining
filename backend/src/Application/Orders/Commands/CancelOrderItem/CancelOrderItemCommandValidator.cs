using FluentValidation;

namespace Application.Orders.Commands.CancelOrderItem;

public class CancelOrderItemCommandValidator : AbstractValidator<CancelOrderItemCommand>
{
    public CancelOrderItemCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Mã đơn hàng không được để trống.");

        RuleFor(x => x.OrderItemId)
            .NotEmpty().WithMessage("Mã món trong đơn không được để trống.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Lý do hủy món không vượt quá 500 ký tự.");
    }
}
