using FluentValidation;

namespace Application.Reservations.Commands.CancelReservation;

public class CancelReservationCommandValidator : AbstractValidator<CancelReservationCommand>
{
    public CancelReservationCommandValidator()
    {
        RuleFor(x => x.BookingCode)
            .NotEmpty().WithMessage("Mã đặt bàn (BookingCode) không được để trống.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Lý do hủy không vượt quá 500 ký tự.");
    }
}
