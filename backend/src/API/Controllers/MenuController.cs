namespace API.Controllers;

[Route("api/menu")]
public class MenuController : ApiControllerBase
{
    private readonly IMenuService _menuService;

    public MenuController(IMenuService menuService)
    {
        _menuService = menuService;
    }

    [HttpGet("table/{id}")]
    public async Task<IActionResult> GetTableMenuAsync(Guid id, CancellationToken ct)
    {
        var result = await _menuService.GetTableMenuAsync(id, ct);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategoriesAsync(CancellationToken ct)
    {
        var result = await _menuService.GetCategoriesAsync(ct);
        return Ok(result);
    }

    [HttpGet("items/{id}")]
    public async Task<IActionResult> GetMenuItemByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _menuService.GetMenuItemByIdAsync(id, ct);
        return Ok(result);
    }
}
