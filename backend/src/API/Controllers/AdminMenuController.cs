using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/admin/menu-items")]
[Route("api/manager/menu-items")]
[Authorize(Roles = "Admin,Manager")]
public class AdminMenuController : ApiControllerBase
{
    private readonly IAdminMenuService _adminMenuService;

    public AdminMenuController(IAdminMenuService adminMenuService)
    {
        _adminMenuService = adminMenuService;
    }

    [HttpPost("/api/admin/categories")]
    [HttpPost("/api/manager/categories")]
    public async Task<IActionResult> CreateCategoryAsync([FromBody] CreateCategoryDto dto, CancellationToken ct)
    {
        var id = await _adminMenuService.CreateCategoryAsync(dto, ct);
        return StatusCode(StatusCodes.Status201Created, new { id, success = true, message = "Tạo danh mục thực đơn thành công." });
    }

    [HttpGet("/api/admin/categories")]
    [HttpGet("/api/manager/categories")]
    public async Task<IActionResult> GetAllCategoriesAsync(CancellationToken ct)
    {
        var result = await _adminMenuService.GetAllCategoriesAsync(ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateMenuItemAsync([FromBody] CreateMenuItemDto dto, CancellationToken ct)
    {
        var id = await _adminMenuService.CreateMenuItemAsync(dto, ct);
        var all = await _adminMenuService.GetAllMenuItemsAsync(ct);
        var created = all.FirstOrDefault(m => m.Id == id);
        return StatusCode(StatusCodes.Status201Created, new
        {
            id,
            success = true,
            categoryId = created?.CategoryId ?? dto.CategoryId,
            categoryName = created?.CategoryName ?? "",
            name = created?.Name ?? dto.Name,
            description = created?.Description ?? dto.Description,
            price = created?.Price ?? dto.Price,
            imageUrl = created?.ImageUrl ?? dto.ImageUrl,
            isAvailable = created?.IsAvailable ?? true,
            status = created?.Status ?? "Available",
            prepTimeMinutes = created?.PrepTimeMinutes ?? dto.PrepTimeMinutes,
            courseType = created?.CourseType ?? dto.CourseType,
            createdAt = created?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMenuItemAsync(Guid id, [FromBody] UpdateMenuItemDto dto, CancellationToken ct)
    {
        var result = await _adminMenuService.UpdateMenuItemAsync(id, dto, ct);
        var all = await _adminMenuService.GetAllMenuItemsAsync(ct);
        var updated = all.FirstOrDefault(m => m.Id == id);
        return Ok(new
        {
            success = result,
            message = "Cập nhật món ăn thành công.",
            id,
            categoryId = updated?.CategoryId ?? dto.CategoryId,
            categoryName = updated?.CategoryName ?? "",
            name = updated?.Name ?? dto.Name,
            description = updated?.Description ?? dto.Description,
            price = updated?.Price ?? dto.Price,
            imageUrl = updated?.ImageUrl ?? dto.ImageUrl,
            isAvailable = updated?.IsAvailable ?? true,
            status = updated?.Status ?? "Available",
            prepTimeMinutes = updated?.PrepTimeMinutes ?? dto.PrepTimeMinutes,
            courseType = updated?.CourseType ?? dto.CourseType,
            createdAt = updated?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpPatch("{id}/availability")]
    public async Task<IActionResult> UpdateAvailabilityAsync(Guid id, [FromBody] ToggleAvailabilityDto dto, CancellationToken ct)
    {
        var result = await _adminMenuService.UpdateAvailabilityAsync(id, dto, ct);
        var all = await _adminMenuService.GetAllMenuItemsAsync(ct);
        var updated = all.FirstOrDefault(m => m.Id == id);
        return Ok(new
        {
            success = result,
            message = "Cập nhật trạng thái món ăn thành công.",
            id,
            categoryId = updated?.CategoryId ?? Guid.Empty,
            categoryName = updated?.CategoryName ?? "",
            name = updated?.Name ?? "",
            description = updated?.Description,
            price = updated?.Price ?? 0m,
            imageUrl = updated?.ImageUrl,
            isAvailable = updated?.IsAvailable ?? dto.IsAvailable,
            status = updated?.Status ?? (dto.IsAvailable ? "Available" : "SoldOut"),
            prepTimeMinutes = updated?.PrepTimeMinutes ?? 15,
            courseType = updated?.CourseType ?? CourseType.Appetizer,
            createdAt = updated?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMenuItemAsync(Guid id, CancellationToken ct)
    {
        var result = await _adminMenuService.DeleteMenuItemAsync(id, ct);
        return Ok(new { success = result, deleted = result, message = "Xóa món ăn thành công." });
    }

    [HttpGet]
    public async Task<IActionResult> GetAllMenuItemsAsync([FromQuery] string? search = null, CancellationToken ct = default)
    {
        var result = await _adminMenuService.GetAllMenuItemsAsync(ct);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim();
            result = result.Where(m => m.Name.Contains(q, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return Ok(result);
    }

    [HttpPost("/api/admin/tasting-menus")]
    [HttpPost("/api/manager/tasting-menus")]
    public async Task<IActionResult> CreateTastingMenuAsync([FromBody] CreateTastingMenuDto dto, CancellationToken ct)
    {
        var id = await _adminMenuService.CreateTastingMenuAsync(dto, ct);
        var all = await _adminMenuService.GetAllTastingMenusAsync(ct);
        var created = all.FirstOrDefault(m => m.Id == id);
        return StatusCode(StatusCodes.Status201Created, new
        {
            id,
            success = true,
            name = created?.Name ?? dto.Name,
            description = created?.Description ?? dto.Description,
            price = created?.Price ?? dto.Price,
            imageUrl = created?.ImageUrl ?? dto.ImageUrl,
            isActive = created?.IsActive ?? dto.IsActive,
            items = created?.Items ?? new List<TastingMenuItemDto>(),
            createdAt = created?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpPut("/api/admin/tasting-menus/{id}")]
    [HttpPut("/api/manager/tasting-menus/{id}")]
    public async Task<IActionResult> UpdateTastingMenuAsync(Guid id, [FromBody] UpdateTastingMenuDto dto, CancellationToken ct)
    {
        var result = await _adminMenuService.UpdateTastingMenuAsync(id, dto, ct);
        var all = await _adminMenuService.GetAllTastingMenusAsync(ct);
        var updated = all.FirstOrDefault(m => m.Id == id);
        return Ok(new
        {
            success = result,
            message = "Cập nhật Tasting Menu thành công.",
            id,
            name = updated?.Name ?? dto.Name,
            description = updated?.Description ?? dto.Description,
            price = updated?.Price ?? dto.Price,
            imageUrl = updated?.ImageUrl ?? dto.ImageUrl,
            isActive = updated?.IsActive ?? dto.IsActive,
            items = updated?.Items ?? new List<TastingMenuItemDto>(),
            createdAt = updated?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpDelete("/api/admin/tasting-menus/{id}")]
    [HttpDelete("/api/manager/tasting-menus/{id}")]
    public async Task<IActionResult> DeleteTastingMenuAsync(Guid id, CancellationToken ct)
    {
        var result = await _adminMenuService.DeleteTastingMenuAsync(id, ct);
        return Ok(new { success = result, deleted = result, message = "Xóa Tasting Menu thành công." });
    }

    [HttpGet("/api/admin/tasting-menus")]
    [HttpGet("/api/manager/tasting-menus")]
    public async Task<IActionResult> GetAllTastingMenusAsync(CancellationToken ct)
    {
        var result = await _adminMenuService.GetAllTastingMenusAsync(ct);
        return Ok(result);
    }
}
