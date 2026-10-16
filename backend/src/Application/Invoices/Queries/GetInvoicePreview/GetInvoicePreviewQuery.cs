using MediatR;

namespace Application.Invoices.Queries.GetInvoicePreview;

public record GetInvoicePreviewQuery(Guid TableId) : IRequest<InvoicePreviewDto>;
