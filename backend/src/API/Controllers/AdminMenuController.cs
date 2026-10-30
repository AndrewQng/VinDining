namespace API.Controllers;

[Route("api/admin/menu-items")]
public class AdminMenuController : ApiControllerBase
{
    private readonly IAdminMenuService _adminMenuService;

    public AdminMenuController(IAdminMenuService adminMenuService)
    {
        _adminMenuService = adminMenuService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateMenuItemAsync([FromBody] CreateMenuItemDto dto, CancellationToken ct)
    {
        var id = await _adminMenuService.CreateMenuItemAsync(dto, ct);
        return CreatedAtAction(nameof(GetAllMenuItemsAsync), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMenuItemAsync(Guid id, [FromBody] UpdateMenuItemDto dto, CancellationToken ct)
    {
        var result = await _adminMenuService.UpdateMenuItemAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cập nhật món ăn thành công." });
    }

    [HttpPatch("{id}/availability")]
    public async Task<IActionResult> UpdateAvailabilityAsync(Guid id, [FromBody] ToggleAvailabilityDto dto, CancellationToken ct)
    {
        var result = await _adminMenuService.UpdateAvailabilityAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cập nhật trạng thái món ăn thành công." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMenuItemAsync(Guid id, CancellationToken ct)
    {
        var result = await _adminMenuService.DeleteMenuItemAsync(id, ct);
        return Ok(new { success = result, message = "Xóa món ăn thành công." });
    }

    [HttpGet]
    public async Task<IActionResult> GetAllMenuItemsAsync(CancellationToken ct)
    {
        var result = await _adminMenuService.GetAllMenuItemsAsync(ct);
        return Ok(result);
    }

    [HttpPost("/api/admin/tasting-menus")]
    public async Task<IActionResult> CreateTastingMenuAsync([FromBody] CreateTastingMenuDto dto, CancellationToken ct)
    {
        var id = await _adminMenuService.CreateTastingMenuAsync(dto, ct);
        return CreatedAtAction(nameof(GetAllTastingMenusAsync), new { id }, new { id });
    }

    [HttpPut("/api/admin/tasting-menus/{id}")]
    public async Task<IActionResult> UpdateTastingMenuAsync(Guid id, [FromBody] UpdateTastingMenuDto dto, CancellationToken ct)
    {
        var result = await _adminMenuService.UpdateTastingMenuAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cập nhật Tasting Menu thành công." });
    }

    [HttpDelete("/api/admin/tasting-menus/{id}")]
    public async Task<IActionResult> DeleteTastingMenuAsync(Guid id, CancellationToken ct)
    {
        var result = await _adminMenuService.DeleteTastingMenuAsync(id, ct);
        return Ok(new { success = result, message = "Xóa Tasting Menu thành công." });
    }

    [HttpGet("/api/admin/tasting-menus")]
    public async Task<IActionResult> GetAllTastingMenusAsync(CancellationToken ct)
    {
        var result = await _adminMenuService.GetAllTastingMenusAsync(ct);
        return Ok(result);
    }
}
