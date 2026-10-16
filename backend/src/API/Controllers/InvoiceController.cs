using Application.Invoices.Commands.SettleInvoice;
using Application.Invoices.Queries.GetInvoicePreview;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
public class InvoiceController : ApiControllerBase
{
    /// <summary>
    /// Xem trước thông tin hóa đơn tạm tính và tiền cọc cấn trừ
    /// </summary>
    /// <param name="tableId">Mã bàn ăn</param>
    /// <returns>Chi tiết tính toán hóa đơn</returns>
    [HttpGet("preview/{tableId:guid}")]
    [ProducesResponseType(typeof(InvoicePreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPreview(Guid tableId)
    {
        var result = await Mediator.Send(new GetInvoicePreviewQuery(tableId));
        return Ok(result);
    }

    /// <summary>
    /// Quyết toán hóa đơn, cấn trừ tiền cọc và chuyển bàn sang chờ dọn dẹp
    /// </summary>
    /// <param name="command">Thông tin quyết toán đơn hàng</param>
    /// <returns>Mã hóa đơn vừa khởi tạo</returns>
    [HttpPost("settle")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SettleInvoice([FromBody] SettleInvoiceCommand command)
    {
        var invoiceId = await Mediator.Send(command);
        return Ok(new { invoiceId, message = "Thanh toán thành công. Bàn đã chuyển sang trạng thái chờ dọn dẹp (Cleaning)." });
    }
}
