using FluentValidation;

namespace Application.Orders.Commands.FireCourse;

public class FireCourseCommandValidator : AbstractValidator<FireCourseCommand>
{
    public FireCourseCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Mã đơn hàng (OrderId) không được để trống.");

        RuleFor(x => x.CourseType)
            .IsInEnum().WithMessage("Loại Course không hợp lệ.");
    }
}
