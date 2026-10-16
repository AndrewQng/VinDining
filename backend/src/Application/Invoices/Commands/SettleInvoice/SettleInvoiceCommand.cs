using Domain.Enums;
using MediatR;

namespace Application.Invoices.Commands.SettleInvoice;

public record SettleInvoiceCommand(
    Guid OrderId,
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
    Guid? StaffId = null
) : IRequest<Guid>;
