using Domain.Enums;
using MediatR;

namespace Application.Reservations.Commands.ConfirmDepositPayment;

public record ConfirmDepositPaymentCommand(
    string BookingCode,
    string TransactionId,
    PaymentMethod PaymentMethod = PaymentMethod.BankTransfer
) : IRequest<bool>;
