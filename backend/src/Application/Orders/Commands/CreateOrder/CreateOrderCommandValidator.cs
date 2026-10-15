using FluentValidation;

namespace Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.TableId)
            .NotEmpty().WithMessage("Mã bàn (TableId) không được để trống.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Đơn hàng phải chứa ít nhất 1 món ăn.")
            .Must(items => items != null && items.Count > 0).WithMessage("Danh sách món không được rỗng.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.MenuItemId)
                .NotEmpty().WithMessage("Mã món ăn không được để trống.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Số lượng món ăn phải lớn hơn 0.")
                .LessThanOrEqualTo(50).WithMessage("Số lượng từng món không được vượt quá 50 phần.");

            item.RuleFor(i => i.Note)
                .MaximumLength(200).WithMessage("Ghi chú món ăn tối đa 200 ký tự.");
        });
    }
}
