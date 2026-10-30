namespace API.Controllers;

[Route("api/invoices")]
public class InvoiceController : ApiControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoiceController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpPost("/api/tables/{tableId}/request-checkout")]
    public async Task<IActionResult> RequestCheckoutAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _invoiceService.RequestCheckoutAsync(tableId, ct);
        return Ok(new { success = result, message = "Đã gửi yêu cầu thanh toán bàn ăn." });
    }

    [HttpGet("preview/{tableId}")]
    public async Task<IActionResult> GetInvoicePreviewAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _invoiceService.CalculateInvoiceAsync(tableId, ct);
        return Ok(result);
    }

    [HttpPost("{tableId}/print-preview")]
    public async Task<IActionResult> PrintPreBillAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _invoiceService.PrintPreBillAsync(tableId, ct);
        return Ok(new { success = result, message = "Lệnh in phiếu tạm tính đã được gửi." });
    }

    [HttpPost("{tableId}/settle")]
    public async Task<IActionResult> SettleInvoiceAsync(Guid tableId, [FromBody] SettleInvoiceDto dto, CancellationToken ct)
    {
        var invoiceId = await _invoiceService.SettleInvoiceAsync(tableId, dto, ct);
        return Ok(new { success = true, invoiceId, message = "Quyết toán hóa đơn thành công." });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvoiceByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _invoiceService.GetInvoiceByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoicesAsync([FromQuery] DateTime? date, CancellationToken ct)
    {
        var result = await _invoiceService.GetInvoicesAsync(date, ct);
        return Ok(result);
    }
}
