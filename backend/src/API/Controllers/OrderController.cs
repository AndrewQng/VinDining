namespace API.Controllers;

[Route("api/orders")]
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
        return CreatedAtAction(nameof(GetOrderDetailsAsync), new { id = orderId }, new { orderId });
    }

    [HttpPost("{id}/fire-course")]
    public async Task<IActionResult> FireNextCourseAsync(Guid id, [FromBody] FireCourseDto dto, CancellationToken ct)
    {
        var count = await _orderService.FireNextCourseAsync(id, dto, ct);
        return Ok(new { success = true, firedCount = count, message = $"Đã bắn lệnh nấu Course {dto.CourseType}." });
    }

    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddOrderItemsAsync(Guid id, [FromBody] AddItemsDto itemsDto, CancellationToken ct)
    {
        var count = await _orderService.AddOrderItemsAsync(id, itemsDto, ct);
        return Ok(new { success = true, addedCount = count });
    }

    [HttpPatch("{id}/items/{itemId}/serve")]
    public async Task<IActionResult> ConfirmServedAsync(Guid id, Guid itemId, CancellationToken ct)
    {
        var result = await _orderService.ConfirmServedAsync(id, itemId, ct);
        return Ok(new { success = result, message = "Xác nhận ra món thành công." });
    }

    [HttpGet("table/{tableId}")]
    public async Task<IActionResult> GetActiveOrderByTableAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _orderService.GetActiveOrderByTableAsync(tableId, ct);
        if (result == null) return NotFound("Bàn chưa có đơn gọi món hoạt động.");
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderDetailsAsync(Guid id, CancellationToken ct)
    {
        var result = await _orderService.GetOrderDetailsAsync(id, ct);
        return Ok(result);
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> CancelOrderItemAsync(Guid id, Guid itemId, CancellationToken ct)
    {
        var result = await _orderService.CancelOrderItemAsync(id, itemId, ct);
        return Ok(new { success = result, message = "Đã hủy món ăn khỏi đơn." });
    }

    [HttpGet("kitchen/pending")]
    public async Task<IActionResult> GetKitchenPendingOrdersAsync(CancellationToken ct)
    {
        var result = await _orderService.GetKitchenPendingOrdersAsync(ct);
        return Ok(result);
    }
}
