using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/menu")]
[AllowAnonymous]
public class MenuController : ApiControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IApplicationDbContext _context;

    public MenuController(IMenuService menuService, IApplicationDbContext context)
    {
        _menuService = menuService;
        _context = context;
    }

    [HttpGet("table/{id}")]
    public async Task<IActionResult> GetTableMenuAsync(string id, CancellationToken ct)
    {
        var key = (id ?? string.Empty).Trim();
        Table? table = null;
        if (Guid.TryParse(key, out var tableGuid))
        {
            table = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tableGuid, ct);
        }
        else
        {
            var normalized = key.StartsWith("VD-QR-", StringComparison.OrdinalIgnoreCase)
                ? key[6..].Trim()
                : key;
            table = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(
                t => t.TableNumber.ToLower() == normalized.ToLower() || t.TableNumber.ToLower() == key.ToLower(),
                ct);
        }

        if (table == null)
            throw new KeyNotFoundException($"Mã QR bàn ăn không hợp lệ ({id}). Vui lòng liên hệ nhân viên phục vụ.");

        var categories = await _menuService.GetTableMenuAsync(table.Id, ct);
        var tastingMenus = await _menuService.GetActiveTastingMenusAsync(ct);
        var items = categories.SelectMany(c => c.Items).ToList();

        return Ok(new
        {
            tableId = table.Id,
            tableNumber = table.TableNumber,
            isCheckedIn = true,
            tastingMenus,
            categories,
            items
        });
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategoriesAsync(CancellationToken ct)
    {
        var result = await _menuService.GetCategoriesAsync(ct);
        return Ok(result);
    }

    [HttpGet("tasting-menus")]
    public async Task<IActionResult> GetActiveTastingMenusAsync(CancellationToken ct)
    {
        var result = await _menuService.GetActiveTastingMenusAsync(ct);
        return Ok(result);
    }

    [HttpGet("items/{id}")]
    public async Task<IActionResult> GetMenuItemByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _menuService.GetMenuItemByIdAsync(id, ct);
        return Ok(result);
    }
}
