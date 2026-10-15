using Application.Orders.Commands.CreateOrder;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
public class OrderController : ApiControllerBase
{
    /// <summary>
    /// Tạo đơn gọi món mới tại bàn (Dành cho Nhân viên phục vụ hoặc Khách quét mã QR tại bàn)
    /// </summary>
    /// <param name="command">Dữ liệu tạo đơn gồm mã bàn và danh sách món</param>
    /// <returns>ID của đơn hàng vừa tạo</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command)
    {
        var orderId = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetOrder), new { id = orderId }, new { orderId });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        await Task.CompletedTask;
        return Ok(new { orderId = id, status = "Processing" });
    }
}
