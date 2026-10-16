using FluentValidation;

namespace Application.Reservations.Commands.CreateReservation;

public class CreateReservationCommandValidator : AbstractValidator<CreateReservationCommand>
{
    public CreateReservationCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên khách hàng không được để trống.")
            .MaximumLength(100).WithMessage("Họ tên không vượt quá 100 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^[0-9]{9,15}$").WithMessage("Số điện thoại không đúng định dạng.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.");

        RuleFor(x => x.TableId)
            .NotEmpty().WithMessage("Mã bàn ăn không được để trống.");

        RuleFor(x => x.ReservationTime)
            .GreaterThan(DateTime.UtcNow).WithMessage("Thời gian đặt bàn phải ở tương lai.");

        RuleFor(x => x.PartySize)
            .GreaterThan(0).WithMessage("Số lượng khách phải lớn hơn 0.")
            .LessThanOrEqualTo(30).WithMessage("Số lượng khách tối đa cho một bàn là 30.");
    }
}
