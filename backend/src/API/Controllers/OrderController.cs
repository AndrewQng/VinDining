using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace API.Controllers;

[Route("api/orders")]
[Route("api/order")]
[Authorize]
public class OrderController : ApiControllerBase
{
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> CreateOrderWithCoursesAsync([FromBody] CreateOrderDto dto, CancellationToken ct)
    {
        var orderId = await _orderService.CreateOrderWithCoursesAsync(dto, ct);
        var detail = await _orderService.GetOrderDetailsAsync(orderId, ct);
        return StatusCode(StatusCodes.Status201Created, detail);
    }

    [HttpPost("{id}/fire-course")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> FireNextCourseAsync(Guid id, [FromBody] FireCourseDto dto, CancellationToken ct)
    {
        var count = await _orderService.FireNextCourseAsync(id, dto, ct);
        var detail = await _orderService.GetOrderDetailsAsync(id, ct);
        return Ok(new
        {
            success = true,
            orderId = id,
            id = detail.Id,
            tableId = detail.TableId,
            tableNumber = detail.TableNumber,
            reservationId = detail.ReservationId,
            createById = detail.CreateById,
            createByName = detail.CreateByName,
            status = detail.Status,
            guestCount = detail.GuestCount,
            openedAt = detail.OpenedAt,
            closedAt = detail.ClosedAt,
            items = detail.Items,
            firedCount = count,
            message = count > 0
                ? $"Đã bắn lệnh nấu {count} món thuộc Course {dto.CourseType}."
                : $"Không còn món nào đang chờ ở Course {dto.CourseType}."
        });
    }

    [HttpPost("{id}/items")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> AddOrderItemsAsync(Guid id, [FromBody] AddItemsDto itemsDto, CancellationToken ct)
    {
        var count = await _orderService.AddOrderItemsAsync(id, itemsDto, ct);
        var detail = await _orderService.GetOrderDetailsAsync(id, ct);
        return Ok(new
        {
            success = true,
            orderId = id,
            id = detail.Id,
            tableId = detail.TableId,
            tableNumber = detail.TableNumber,
            reservationId = detail.ReservationId,
            createById = detail.CreateById,
            createByName = detail.CreateByName,
            status = detail.Status,
            guestCount = detail.GuestCount,
            openedAt = detail.OpenedAt,
            closedAt = detail.ClosedAt,
            items = detail.Items,
            addedCount = count,
            message = $"Đã bổ sung {count} món vào đơn phục vụ."
        });
    }

    [HttpPatch("{id}/items/{itemId}/serve")]
    [Authorize(Roles = "Expediter,Admin,Manager")]
    public async Task<IActionResult> ConfirmServedAsync(Guid id, Guid itemId, CancellationToken ct)
    {
        var result = await _orderService.ConfirmServedAsync(id, itemId, ct);
        var detail = await _orderService.GetOrderDetailsAsync(id, ct);
        var item = detail.Items.FirstOrDefault(i => i.Id == itemId);
        return Ok(new
        {
            success = result,
            message = "Xác nhận ra món thành công.",
            id = item?.Id ?? itemId,
            orderId = id,
            menuItemId = item?.MenuItemId,
            tastingMenuId = item?.TastingMenuId,
            itemName = item?.ItemName ?? "",
            courseType = item?.CourseType ?? CourseType.MainCourse,
            quantity = item?.Quantity ?? 1,
            unitPrice = item?.UnitPrice ?? 0m,
            status = item?.Status ?? OrderItemStatus.Served,
            note = item?.Note,
            isRemake = item?.IsRemake ?? false,
            remakeCount = item?.RemakeCount ?? 0,
            isPriority = item?.IsPriority ?? false,
            prepTimeMinutes = item?.PrepTimeMinutes ?? 15,
            cookingStartedAt = item?.CookingStartedAt,
            servedAt = item?.ServedAt,
            servedById = item?.ServedById
        });
    }

    [HttpPost("{id}/items/{itemId}/remake")]
    [Authorize(Roles = "Expediter,Admin,Manager")]
    public async Task<IActionResult> RequestRemakeAsync(
        Guid id,
        Guid itemId,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RemakeItemDto? dto,
        CancellationToken ct)
    {
        var result = await _orderService.RemakeOrderItemAsync(id, itemId, dto, ct);
        var detail = await _orderService.GetOrderDetailsAsync(id, ct);
        var item = detail.Items.FirstOrDefault(i => i.Id == itemId);
        return Ok(new
        {
            success = result,
            message = "Đã gửi yêu cầu làm lại món về bếp.",
            id = item?.Id ?? itemId,
            orderId = id,
            menuItemId = item?.MenuItemId,
            tastingMenuId = item?.TastingMenuId,
            itemName = item?.ItemName ?? "",
            courseType = item?.CourseType ?? CourseType.MainCourse,
            quantity = item?.Quantity ?? 1,
            unitPrice = item?.UnitPrice ?? 0m,
            status = item?.Status ?? OrderItemStatus.Preparing,
            note = item?.Note,
            isRemake = item?.IsRemake ?? true,
            remakeCount = item?.RemakeCount ?? 1,
            isPriority = item?.IsPriority ?? true,
            prepTimeMinutes = item?.PrepTimeMinutes ?? 15,
            cookingStartedAt = item?.CookingStartedAt,
            servedAt = item?.ServedAt,
            servedById = item?.ServedById
        });
    }

    [HttpPatch("{id}/items/{itemId}/remake")]
    [Authorize(Roles = "Expediter,Admin,Manager")]
    public async Task<IActionResult> RemakeOrderItemAsync(
        Guid id,
        Guid itemId,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RemakeItemDto? dto,
        CancellationToken ct)
    {
        var result = await _orderService.RemakeOrderItemAsync(id, itemId, dto, ct);
        var detail = await _orderService.GetOrderDetailsAsync(id, ct);
        var item = detail.Items.FirstOrDefault(i => i.Id == itemId);
        return Ok(new
        {
            success = result,
            message = "Đã gửi yêu cầu làm lại món về bếp.",
            id = item?.Id ?? itemId,
            orderId = id,
            menuItemId = item?.MenuItemId,
            tastingMenuId = item?.TastingMenuId,
            itemName = item?.ItemName ?? "",
            courseType = item?.CourseType ?? CourseType.MainCourse,
            quantity = item?.Quantity ?? 1,
            unitPrice = item?.UnitPrice ?? 0m,
            status = item?.Status ?? OrderItemStatus.Preparing,
            note = item?.Note,
            isRemake = item?.IsRemake ?? true,
            remakeCount = item?.RemakeCount ?? 1,
            isPriority = item?.IsPriority ?? true,
            prepTimeMinutes = item?.PrepTimeMinutes ?? 15,
            cookingStartedAt = item?.CookingStartedAt,
            servedAt = item?.ServedAt,
            servedById = item?.ServedById
        });
    }

    [HttpGet("table/{tableId}")]
    [Authorize(Roles = "Waitstaff,Expediter,Cashier,Admin,Manager")]
    public async Task<IActionResult> GetActiveOrderByTableAsync(Guid tableId, CancellationToken ct)
    {
        var result = await _orderService.GetActiveOrderByTableAsync(tableId, ct);
        if (result == null)
            throw new KeyNotFoundException("Bàn chưa có đơn gọi món hoạt động.");
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Waitstaff,Expediter,Cashier,Admin,Manager")]
    public async Task<IActionResult> GetOrderDetailsAsync(Guid id, CancellationToken ct)
    {
        var result = await _orderService.GetOrderDetailsAsync(id, ct);
        return Ok(result);
    }

    [HttpDelete("{id}/items/{itemId}")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> CancelOrderItemDeleteAsync(Guid id, Guid itemId, CancellationToken ct)
    {
        var result = await _orderService.CancelOrderItemAsync(id, itemId, null, ct);
        return Ok(new { success = result, message = "Đã hủy món ăn khỏi đơn." });
    }

    [HttpPatch("{id}/items/{itemId}/cancel")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> CancelOrderItemPatchAsync(
        Guid id,
        Guid itemId,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] CancelItemDto? dto,
        CancellationToken ct)
    {
        var result = await _orderService.CancelOrderItemAsync(id, itemId, dto?.Reason, ct);
        return Ok(new { success = result, message = "Đã hủy món ăn khỏi đơn." });
    }

    [HttpGet("kitchen/pending")]
    [AllowAnonymous]
    public async Task<IActionResult> GetKitchenPendingOrdersAsync(CancellationToken ct)
    {
        var result = await _orderService.GetKitchenPendingOrdersAsync(ct);
        return Ok(result);
    }
}
