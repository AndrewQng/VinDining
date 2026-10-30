namespace API.Services;

public class AdminMenuService : IAdminMenuService
{
    private readonly IApplicationDbContext _context;

    public AdminMenuService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> CreateMenuItemAsync(CreateMenuItemDto dto, CancellationToken ct = default)
    {
        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Price = dto.Price,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            Status = dto.IsAvailable ? "Available" : "Unavailable",
            CourseType = dto.CourseType,
            CategoryId = dto.CategoryId
        };
        await _context.MenuItems.AddAsync(item, ct);
        await _context.SaveChangesAsync(ct);
        return item.Id;
    }

    public async Task<bool> UpdateMenuItemAsync(Guid id, UpdateMenuItemDto dto, CancellationToken ct = default)
    {
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item == null) throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        item.Name = dto.Name;
        item.Price = dto.Price;
        item.Description = dto.Description;
        item.ImageUrl = dto.ImageUrl;
        item.Status = dto.IsAvailable ? "Available" : "Unavailable";
        item.CourseType = dto.CourseType;
        item.CategoryId = dto.CategoryId;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UpdateAvailabilityAsync(Guid id, ToggleAvailabilityDto dto, CancellationToken ct = default)
    {
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item == null) throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        item.Status = dto.IsAvailable ? "Available" : "Unavailable";
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteMenuItemAsync(Guid id, CancellationToken ct = default)
    {
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item == null) throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        _context.MenuItems.Remove(item);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<MenuItemDto>> GetAllMenuItemsAsync(CancellationToken ct = default)
    {
        var items = await _context.MenuItems
            .Include(m => m.Category)
            .AsNoTracking()
            .ToListAsync(ct);

        return items.Select(m => new MenuItemDto(
            m.Id,
            m.Name,
            m.Price,
            m.Description,
            m.ImageUrl,
            m.Status == "Available",
            m.CourseType,
            m.CategoryId,
            m.Category?.Name ?? "N/A"
        )).ToList();
    }

    public async Task<Guid> CreateTastingMenuAsync(CreateTastingMenuDto dto, CancellationToken ct = default)
    {
        var tastingMenu = new TastingMenu
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Price = dto.Price,
            Description = dto.Description,
            IsActive = true
        };

        foreach (var i in dto.Items)
        {
            tastingMenu.TastingMenuItems.Add(new TastingMenuItem
            {
                TastingMenuId = tastingMenu.Id,
                MenuItemId = i.MenuItemId,
                CourseType = i.CourseType,
                CourseOrder = i.SequenceOrder
            });
        }

        await _context.TastingMenus.AddAsync(tastingMenu, ct);
        await _context.SaveChangesAsync(ct);
        return tastingMenu.Id;
    }

    public async Task<bool> UpdateTastingMenuAsync(Guid id, UpdateTastingMenuDto dto, CancellationToken ct = default)
    {
        var menu = await _context.TastingMenus.Include(m => m.TastingMenuItems).FirstOrDefaultAsync(m => m.Id == id, ct);
        if (menu == null) throw new KeyNotFoundException($"Không tìm thấy Tasting Menu {id}.");

        menu.Name = dto.Name;
        menu.Price = dto.Price;
        menu.Description = dto.Description;

        menu.TastingMenuItems.Clear();
        foreach (var i in dto.Items)
        {
            menu.TastingMenuItems.Add(new TastingMenuItem
            {
                TastingMenuId = menu.Id,
                MenuItemId = i.MenuItemId,
                CourseType = i.CourseType,
                CourseOrder = i.SequenceOrder
            });
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteTastingMenuAsync(Guid id, CancellationToken ct = default)
    {
        var menu = await _context.TastingMenus.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (menu == null) throw new KeyNotFoundException($"Không tìm thấy Tasting Menu {id}.");

        _context.TastingMenus.Remove(menu);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<TastingMenuDto>> GetAllTastingMenusAsync(CancellationToken ct = default)
    {
        var list = await _context.TastingMenus
            .Include(m => m.TastingMenuItems)
                .ThenInclude(i => i.MenuItem)
            .AsNoTracking()
            .ToListAsync(ct);

        return list.Select(m => new TastingMenuDto(
            m.Id,
            m.Name,
            m.Price,
            m.Description,
            m.IsActive,
            m.TastingMenuItems.Select(i => new TastingMenuItemDto(
                i.MenuItemId,
                i.MenuItem?.Name ?? "N/A",
                i.CourseType,
                i.CourseOrder
            )).ToList()
        )).ToList();
    }
}
