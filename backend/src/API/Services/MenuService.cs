namespace API.Services;

public class MenuService : IMenuService
{
    private readonly IApplicationDbContext _context;

    public MenuService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetTableMenuAsync(Guid tableId, CancellationToken ct = default)
    {
        return await GetCategoriesAsync(ct);
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        var categories = await _context.Categories
            .Include(c => c.MenuItems)
            .AsNoTracking()
            .ToListAsync(ct);

        return categories.Select(c => new CategoryDto(
            c.Id,
            c.Name,
            c.Description,
            c.MenuItems.Where(m => m.Status == "Available").Select(m => new MenuItemDto(
                m.Id,
                m.Name,
                m.Price,
                m.Description,
                m.ImageUrl,
                m.Status == "Available",
                m.CourseType,
                m.CategoryId,
                c.Name
            )).ToList()
        )).ToList();
    }

    public async Task<MenuItemDto> GetMenuItemByIdAsync(Guid id, CancellationToken ct = default)
    {
        var m = await _context.MenuItems
            .Include(x => x.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (m == null) throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        return new MenuItemDto(
            m.Id,
            m.Name,
            m.Price,
            m.Description,
            m.ImageUrl,
            m.Status == "Available",
            m.CourseType,
            m.CategoryId,
            m.Category?.Name ?? "N/A"
        );
    }
}
