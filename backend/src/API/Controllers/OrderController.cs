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

    /// <summary>
    /// Kích hoạt nấu theo đợt (Course Firing)
    /// </summary>
    [HttpPost("{id:guid}/fire-course")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FireCourse(Guid id, [FromBody] FireCourseRequest request)
    {
        var command = new Application.Orders.Commands.FireCourse.FireCourseCommand(id, request.CourseType, request.IsPriority);
        var firedCount = await Mediator.Send(command);
        return Ok(new { orderId = id, firedCount, message = $"Đã kích hoạt {firedCount} món thuộc {request.CourseType}." });
    }

    /// <summary>
    /// Expediter kiểm đồ và xác nhận ra món (Served)
    /// </summary>
    [HttpPatch("{id:guid}/items/{itemId:guid}/serve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ServeItem(Guid id, Guid itemId)
    {
        var command = new Application.Orders.Commands.ServeOrderItem.ServeOrderItemCommand(id, itemId);
        var result = await Mediator.Send(command);
        return Ok(new { success = result, message = "Đã xác nhận ra món thành công." });
    }

    /// <summary>
    /// Expediter yêu cầu làm lại đĩa món không đạt tiêu chuẩn (Remake - Rush)
    /// </summary>
    [HttpPatch("{id:guid}/items/{itemId:guid}/remake")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemakeItem(Guid id, Guid itemId, [FromBody] RemakeItemRequest? request)
    {
        var command = new Application.Orders.Commands.RemakeOrderItem.RemakeOrderItemCommand(id, itemId, request?.Reason);
        var result = await Mediator.Send(command);
        return Ok(new { success = result, message = "Đã yêu cầu làm lại món ăn với mức độ ưu tiên khẩn cấp." });
    }

    /// <summary>
    /// Hủy món ăn trong đơn hàng
    /// </summary>
    [HttpPatch("{id:guid}/items/{itemId:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelItem(Guid id, Guid itemId, [FromBody] CancelItemRequest? request)
    {
        var command = new Application.Orders.Commands.CancelOrderItem.CancelOrderItemCommand(id, itemId, request?.Reason);
        var result = await Mediator.Send(command);
        return Ok(new { success = result, message = "Đã hủy món ăn trong đơn hàng thành công." });
    }
}

public record FireCourseRequest(Domain.Enums.CourseType CourseType, bool IsPriority = false);
public record RemakeItemRequest(string? Reason);
public record CancelItemRequest(string? Reason);
