using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public class MenuService : IMenuService
{
    public const string CategoriesCacheKey = "Menu:Categories:Available";
    public const string TastingMenusCacheKey = "Menu:TastingMenus:Active";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public MenuService(IApplicationDbContext context, IMemoryCache? cache = null)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<CategoryDto>> GetTableMenuAsync(Guid tableId, CancellationToken ct = default)
    {
        var tableExists = await _context.Tables.AsNoTracking().AnyAsync(t => t.Id == tableId && t.IsActive, ct);
        if (!tableExists)
            throw new KeyNotFoundException($"Không tìm thấy bàn phục vụ {tableId} cho thực đơn QR.");

        return await GetCategoriesAsync(ct);
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        if (_cache != null && _cache.TryGetValue<List<CategoryDto>>(CategoriesCacheKey, out var cached) && cached != null)
        {
            return cached;
        }

        var categories = await _context.Categories
            .Include(c => c.MenuItems)
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        var result = categories.Select(c => new CategoryDto(
            c.Id,
            c.Name,
            c.Description,
            c.MenuItems
                .Where(m => m.Status == "Available")
                .OrderBy(m => m.CourseType)
                .ThenBy(m => m.Name)
                .Select(m => new MenuItemDto(
                    m.Id,
                    m.Name,
                    m.Price,
                    m.Description,
                    m.ImageUrl,
                    true,
                    m.CourseType,
                    m.CategoryId,
                    c.Name,
                    m.PrepTimeMinutes
                )).ToList()
        )).ToList();

        _cache?.Set(CategoriesCacheKey, result, CacheTtl);
        return result;
    }

    public async Task<List<TastingMenuDto>> GetActiveTastingMenusAsync(CancellationToken ct = default)
    {
        if (_cache != null && _cache.TryGetValue<List<TastingMenuDto>>(TastingMenusCacheKey, out var cached) && cached != null)
        {
            return cached;
        }

        var list = await _context.TastingMenus
            .Include(m => m.TastingMenuItems)
                .ThenInclude(i => i.MenuItem)
            .AsNoTracking()
            .Where(m => m.IsActive)
            .OrderBy(m => m.Price)
            .ToListAsync(ct);

        var result = list.Select(m => new TastingMenuDto(
            m.Id,
            m.Name,
            m.Price,
            m.Description,
            m.IsActive,
            m.TastingMenuItems
                .OrderBy(i => i.CourseOrder)
                .Select(i => new TastingMenuItemDto(
                    i.MenuItemId,
                    i.MenuItem?.Name ?? "N/A",
                    i.CourseType,
                    i.CourseOrder
                )).ToList()
        )).ToList();

        _cache?.Set(TastingMenusCacheKey, result, CacheTtl);
        return result;
    }

    public async Task<MenuItemDto> GetMenuItemByIdAsync(Guid id, CancellationToken ct = default)
    {
        var m = await _context.MenuItems
            .Include(x => x.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (m == null)
            throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        return new MenuItemDto(
            m.Id,
            m.Name,
            m.Price,
            m.Description,
            m.ImageUrl,
            m.Status == "Available",
            m.CourseType,
            m.CategoryId,
            m.Category?.Name ?? "N/A",
            m.PrepTimeMinutes
        );
    }
}
