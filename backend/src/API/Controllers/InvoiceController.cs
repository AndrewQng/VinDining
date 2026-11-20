using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/invoices")]
[Route("api/invoice")]
[Authorize]
public class InvoiceController : ApiControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly ITableService _tableService;

    public InvoiceController(IInvoiceService invoiceService, ITableService tableService)
    {
        _invoiceService = invoiceService;
        _tableService = tableService;
    }

    [HttpPost("/api/tables/{tableId}/request-checkout")]
    [Authorize(Roles = "Waitstaff,Cashier,Admin,Manager")]
    public async Task<IActionResult> RequestCheckoutAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _invoiceService.RequestCheckoutAsync(tableId, ct);
        var table = await _tableService.GetTableByIdAsync(tableId, ct);
        return Ok(new
        {
            success = result,
            message = "Đã gửi yêu cầu thanh toán bàn ăn về quầy thu ngân.",
            id = table.Id,
            tableNumber = table.TableNumber,
            qrCode = table.QrCode,
            capacity = table.Capacity,
            zone = table.Zone,
            status = "PaymentPending",
            posX = table.PosX,
            posY = table.PosY,
            isActive = table.IsActive,
            assignedStaffId = table.AssignedStaffId,
            assignedStaffName = table.AssignedStaffName,
            currentOrderId = table.CurrentOrderId,
            currentReservationCode = table.CurrentReservationCode,
            guestCount = table.GuestCount,
            holdExpiresAt = table.HoldExpiresAt,
            checkoutRequestedAt = DateTime.UtcNow
        });
    }

    [HttpGet("preview/{tableId}")]
    [Authorize(Roles = "Cashier,Admin,Manager")]
    public async Task<IActionResult> GetInvoicePreviewAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _invoiceService.CalculateInvoiceAsync(tableId, ct);
        return Ok(result);
    }

    [HttpPost("{tableId}/print-preview")]
    [Authorize(Roles = "Cashier,Admin,Manager")]
    public async Task<IActionResult> PrintPreBillAsync(Guid tableId, CancellationToken ct)
    {
        var preBill = await _invoiceService.CalculateInvoiceAsync(tableId, ct);
        return Ok(new
        {
            success = true,
            message = "Lệnh in phiếu tạm tính kèm mã VietQR đã được khởi tạo.",
            printedAt = DateTime.UtcNow.ToString("O"),
            preview = preBill,
            preBill
        });
    }

    [HttpPost("settle")]
    [Authorize(Roles = "Cashier,Admin,Manager")]
    public async Task<IActionResult> SettleInvoiceByOrderAsync([FromBody] SettleInvoiceDto dto, CancellationToken ct)
    {
        var invoiceId = await _invoiceService.SettleInvoiceByOrderAsync(dto, ct);
        var invoice = await _invoiceService.GetInvoiceByIdAsync(invoiceId, ct);
        return Ok(BuildSettleResponse(invoiceId, invoice));
    }

    [HttpPost("{tableId}/settle")]
    [Authorize(Roles = "Cashier,Admin,Manager")]
    public async Task<IActionResult> SettleInvoiceAsync(Guid tableId, [FromBody] SettleInvoiceDto dto, CancellationToken ct)
    {
        var invoiceId = await _invoiceService.SettleInvoiceAsync(tableId, dto, ct);
        var invoice = await _invoiceService.GetInvoiceByIdAsync(invoiceId, ct);
        return Ok(BuildSettleResponse(invoiceId, invoice));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Cashier,Admin,Manager")]
    public async Task<IActionResult> GetInvoiceByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _invoiceService.GetInvoiceByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Cashier,Admin,Manager")]
    public async Task<IActionResult> GetInvoicesAsync(
        [FromQuery] DateTime? date = null,
        [FromQuery] string? paymentMethod = null,
        CancellationToken ct = default)
    {
        PaymentMethod? parsedMethod = null;
        if (!string.IsNullOrWhiteSpace(paymentMethod))
        {
            var raw = paymentMethod.Trim();
            if (string.Equals(raw, "VietQR", StringComparison.OrdinalIgnoreCase))
            {
                parsedMethod = PaymentMethod.BankTransfer;
            }
            else if (Enum.TryParse<PaymentMethod>(raw, ignoreCase: true, out var m))
            {
                parsedMethod = m;
            }
            else
            {
                throw new ArgumentException($"Phương thức thanh toán '{raw}' không hợp lệ.");
            }
        }

        var result = await _invoiceService.GetInvoicesAsync(date, ct);
        if (parsedMethod.HasValue)
        {
            result = result.Where(i => i.PaymentMethod == parsedMethod.Value).ToList();
        }
        return Ok(result);
    }

    private static object BuildSettleResponse(Guid invoiceId, InvoiceDto invoice) => new
    {
        success = true,
        invoiceId,
        message = "Quyết toán hóa đơn và đóng bàn thành công.",
        invoice,
        id = invoice.Id,
        orderId = invoice.OrderId,
        tableId = invoice.TableId,
        tableNumber = invoice.TableNumber,
        settleById = invoice.SettleById,
        settleByName = invoice.SettleByName,
        guestCount = invoice.GuestCount,
        waiterName = invoice.WaiterName,
        items = invoice.Items,
        tastingMenuNames = invoice.TastingMenuNames,
        subtotal = invoice.Subtotal,
        serviceCharge = invoice.ServiceCharge,
        vatAmount = invoice.VatAmount,
        deductedDeposit = invoice.DeductedDeposit,
        finalTotal = invoice.FinalTotal,
        totalAmount = invoice.TotalAmount,
        amountDue = invoice.AmountDue,
        paymentMethod = invoice.PaymentMethod,
        isPaid = invoice.IsPaid,
        surveyToken = invoice.SurveyToken,
        surveySentAt = invoice.SurveySentAt,
        createdAt = invoice.CreatedAt
    };
}
