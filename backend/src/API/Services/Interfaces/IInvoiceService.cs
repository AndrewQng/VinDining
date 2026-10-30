namespace API.Services.Interfaces;

public interface IInvoiceService
{
    Task<bool> RequestCheckoutAsync(Guid tableId, CancellationToken ct = default);
    Task<InvoicePreviewDto> CalculateInvoiceAsync(Guid tableId, CancellationToken ct = default);
    Task<bool> PrintPreBillAsync(Guid tableId, CancellationToken ct = default);
    Task<Guid> SettleInvoiceAsync(Guid tableId, SettleInvoiceDto dto, CancellationToken ct = default);
    Task<InvoiceDto> GetInvoiceByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<InvoiceDto>> GetInvoicesAsync(DateTime? date = null, CancellationToken ct = default);
}
