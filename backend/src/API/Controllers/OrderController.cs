namespace API.Controllers;

[Route("api/orders")]
[Route("api/order")]
public class OrderController : ApiControllerBase
{
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrderWithCoursesAsync([FromBody] CreateOrderDto dto, CancellationToken ct)
    {
        var orderId = await _orderService.CreateOrderWithCoursesAsync(dto, ct);
        return StatusCode(StatusCodes.Status201Created, new { orderId, id = orderId });
    }

    [HttpPost("{id}/fire-course")]
    public async Task<IActionResult> FireNextCourseAsync(Guid id, [FromBody] FireCourseDto dto, CancellationToken ct)
    {
        var count = await _orderService.FireNextCourseAsync(id, dto, ct);
        return Ok(new
        {
            success = true,
            orderId = id,
            firedCount = count,
            message = count > 0
                ? $"Đã bắn lệnh nấu {count} món thuộc Course {dto.CourseType}."
                : $"Không còn món nào đang chờ ở Course {dto.CourseType}."
        });
    }

    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddOrderItemsAsync(Guid id, [FromBody] AddItemsDto itemsDto, CancellationToken ct)
    {
        var count = await _orderService.AddOrderItemsAsync(id, itemsDto, ct);
        return Ok(new { success = true, orderId = id, addedCount = count, message = $"Đã bổ sung {count} món vào đơn phục vụ." });
    }

    [HttpPatch("{id}/items/{itemId}/serve")]
    public async Task<IActionResult> ConfirmServedAsync(Guid id, Guid itemId, CancellationToken ct)
    {
        var result = await _orderService.ConfirmServedAsync(id, itemId, ct);
        return Ok(new { success = result, message = "Xác nhận ra món thành công." });
    }

    [HttpPatch("{id}/items/{itemId}/remake")]
    public async Task<IActionResult> RemakeOrderItemAsync(Guid id, Guid itemId, [FromBody] RemakeItemDto? dto, CancellationToken ct)
    {
        var result = await _orderService.RemakeOrderItemAsync(id, itemId, dto, ct);
        return Ok(new { success = result, message = "Đã gửi yêu cầu nấu lại ưu tiên (RUSH) xuống bếp." });
    }

    [HttpGet("table/{tableId}")]
    public async Task<IActionResult> GetActiveOrderByTableAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _orderService.GetActiveOrderByTableAsync(tableId, ct);
        if (result == null)
            throw new KeyNotFoundException("Bàn chưa có đơn gọi món hoạt động.");
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderDetailsAsync(Guid id, CancellationToken ct)
    {
        var result = await _orderService.GetOrderDetailsAsync(id, ct);
        return Ok(result);
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> CancelOrderItemDeleteAsync(Guid id, Guid itemId, CancellationToken ct)
    {
        var result = await _orderService.CancelOrderItemAsync(id, itemId, null, ct);
        return Ok(new { success = result, message = "Đã hủy món ăn khỏi đơn." });
    }

    [HttpPatch("{id}/items/{itemId}/cancel")]
    public async Task<IActionResult> CancelOrderItemPatchAsync(Guid id, Guid itemId, [FromBody] CancelItemDto? dto, CancellationToken ct)
    {
        var result = await _orderService.CancelOrderItemAsync(id, itemId, dto?.Reason, ct);
        return Ok(new { success = result, message = "Đã hủy món ăn khỏi đơn." });
    }

    [HttpGet("kitchen/pending")]
    public async Task<IActionResult> GetKitchenPendingOrdersAsync(CancellationToken ct)
    {
        var result = await _orderService.GetKitchenPendingOrdersAsync(ct);
        return Ok(result);
    }
}
