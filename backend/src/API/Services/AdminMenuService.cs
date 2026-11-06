using API.Models.Common;
using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public class AdminMenuService : IAdminMenuService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public AdminMenuService(IApplicationDbContext context, IMemoryCache? cache = null)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<Guid> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên danh mục thực đơn không được để trống.");

        var normalizedName = dto.Name.Trim();
        var exists = await _context.Categories.AnyAsync(c => c.Name == normalizedName, ct);
        if (exists)
            throw new ConflictException($"Danh mục '{normalizedName}' đã tồn tại.");

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = dto.Description?.Trim(),
            IsActive = true
        };

        await _context.Categories.AddAsync(category, ct);
        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return category.Id;
    }

    public async Task<List<CategoryDto>> GetAllCategoriesAsync(CancellationToken ct = default)
    {
        var categories = await _context.Categories
            .Include(c => c.MenuItems)
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        return categories.Select(c => new CategoryDto(
            c.Id,
            c.Name,
            c.Description,
            c.MenuItems.Select(m => new MenuItemDto(
                m.Id,
                m.Name,
                m.Price,
                m.Description,
                m.ImageUrl,
                m.Status == "Available",
                m.CourseType,
                m.CategoryId,
                c.Name,
                m.PrepTimeMinutes
            )).ToList()
        )).ToList();
    }

    public async Task<Guid> CreateMenuItemAsync(CreateMenuItemDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên món ăn không được để trống.");
        if (dto.Price <= 0)
            throw new ArgumentException("Đơn giá món ăn phải lớn hơn 0.");
        if (dto.PrepTimeMinutes <= 0)
            throw new ArgumentException("Định mức thời gian chế biến (Prep SLA) phải lớn hơn 0 phút.");

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId, ct);
        if (!categoryExists)
            throw new KeyNotFoundException($"Không tìm thấy danh mục món ăn {dto.CategoryId}.");

        var normalizedName = dto.Name.Trim();
        var duplicate = await _context.MenuItems.AnyAsync(m => m.Name == normalizedName, ct);
        if (duplicate)
            throw new ConflictException($"Món ăn '{normalizedName}' đã tồn tại trong thực đơn.");

        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Price = dto.Price,
            Description = dto.Description?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            Status = dto.IsAvailable ? "Available" : "Unavailable",
            CourseType = dto.CourseType,
            CategoryId = dto.CategoryId,
            PrepTimeMinutes = dto.PrepTimeMinutes
        };

        await _context.MenuItems.AddAsync(item, ct);
        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return item.Id;
    }

    public async Task<bool> UpdateMenuItemAsync(Guid id, UpdateMenuItemDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên món ăn không được để trống.");
        if (dto.Price <= 0)
            throw new ArgumentException("Đơn giá món ăn phải lớn hơn 0.");
        if (dto.PrepTimeMinutes <= 0)
            throw new ArgumentException("Định mức thời gian chế biến (Prep SLA) phải lớn hơn 0 phút.");

        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item == null)
            throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId, ct);
        if (!categoryExists)
            throw new KeyNotFoundException($"Không tìm thấy danh mục món ăn {dto.CategoryId}.");

        var normalizedName = dto.Name.Trim();
        var duplicate = await _context.MenuItems.AnyAsync(m => m.Id != id && m.Name == normalizedName, ct);
        if (duplicate)
            throw new ConflictException($"Món ăn '{normalizedName}' đã tồn tại trong thực đơn.");

        item.Name = normalizedName;
        item.Price = dto.Price;
        item.Description = dto.Description?.Trim();
        item.ImageUrl = dto.ImageUrl?.Trim();
        item.Status = dto.IsAvailable ? "Available" : "Unavailable";
        item.CourseType = dto.CourseType;
        item.CategoryId = dto.CategoryId;
        item.PrepTimeMinutes = dto.PrepTimeMinutes;

        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return true;
    }

    public async Task<bool> UpdateAvailabilityAsync(Guid id, ToggleAvailabilityDto dto, CancellationToken ct = default)
    {
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item == null)
            throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        item.Status = dto.IsAvailable ? "Available" : "Unavailable";
        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return true;
    }

    public async Task<bool> DeleteMenuItemAsync(Guid id, CancellationToken ct = default)
    {
        var item = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item == null)
            throw new KeyNotFoundException($"Không tìm thấy món ăn {id}.");

        var referencedInOrders = await _context.OrderItems.AnyAsync(oi => oi.MenuItemId == id, ct)
            || await _context.TastingMenuItems.AnyAsync(tmi => tmi.MenuItemId == id, ct);

        if (referencedInOrders)
        {
            item.Status = "Unavailable";
        }
        else
        {
            _context.MenuItems.Remove(item);
        }

        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return true;
    }

    public async Task<List<MenuItemDto>> GetAllMenuItemsAsync(CancellationToken ct = default)
    {
        var items = await _context.MenuItems
            .Include(m => m.Category)
            .AsNoTracking()
            .OrderBy(m => m.CourseType)
            .ThenBy(m => m.Name)
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
            m.Category?.Name ?? "N/A",
            m.PrepTimeMinutes
        )).ToList();
    }

    public async Task<Guid> CreateTastingMenuAsync(CreateTastingMenuDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên thực đơn Set Menu không được để trống.");
        if (dto.Price <= 0)
            throw new ArgumentException("Giá thực đơn Set Menu phải lớn hơn 0.");
        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Thực đơn Set Menu phải bao gồm ít nhất một món ăn.");

        var itemIds = dto.Items.Select(i => i.MenuItemId).Distinct().ToList();
        var existingCount = await _context.MenuItems.CountAsync(m => itemIds.Contains(m.Id), ct);
        if (existingCount != itemIds.Count)
            throw new KeyNotFoundException("Một hoặc nhiều món ăn trong Set Menu không tồn tại.");

        var tastingMenu = new TastingMenu
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Price = dto.Price,
            Description = dto.Description?.Trim(),
            IsActive = dto.IsActive
        };

        foreach (var i in dto.Items.OrderBy(x => x.SequenceOrder))
        {
            tastingMenu.TastingMenuItems.Add(new TastingMenuItem
            {
                Id = Guid.NewGuid(),
                TastingMenuId = tastingMenu.Id,
                MenuItemId = i.MenuItemId,
                CourseType = i.CourseType,
                CourseOrder = i.SequenceOrder
            });
        }

        await _context.TastingMenus.AddAsync(tastingMenu, ct);
        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return tastingMenu.Id;
    }

    public async Task<bool> UpdateTastingMenuAsync(Guid id, UpdateTastingMenuDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tên thực đơn Set Menu không được để trống.");
        if (dto.Price <= 0)
            throw new ArgumentException("Giá thực đơn Set Menu phải lớn hơn 0.");

        var menu = await _context.TastingMenus
            .Include(m => m.TastingMenuItems)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        if (menu == null)
            throw new KeyNotFoundException($"Không tìm thấy Tasting Menu {id}.");

        menu.Name = dto.Name.Trim();
        menu.Price = dto.Price;
        menu.Description = dto.Description?.Trim();
        menu.IsActive = dto.IsActive;

        _context.TastingMenuItems.RemoveRange(menu.TastingMenuItems);
        menu.TastingMenuItems.Clear();

        foreach (var i in (dto.Items ?? new List<CreateTastingMenuItemDto>()).OrderBy(x => x.SequenceOrder))
        {
            menu.TastingMenuItems.Add(new TastingMenuItem
            {
                Id = Guid.NewGuid(),
                TastingMenuId = menu.Id,
                MenuItemId = i.MenuItemId,
                CourseType = i.CourseType,
                CourseOrder = i.SequenceOrder
            });
        }

        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return true;
    }

    public async Task<bool> DeleteTastingMenuAsync(Guid id, CancellationToken ct = default)
    {
        var menu = await _context.TastingMenus.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (menu == null)
            throw new KeyNotFoundException($"Không tìm thấy Tasting Menu {id}.");

        var referenced = await _context.OrderItems.AnyAsync(oi => oi.TastingMenuId == id, ct);
        if (referenced)
        {
            menu.IsActive = false;
        }
        else
        {
            _context.TastingMenus.Remove(menu);
        }

        await _context.SaveChangesAsync(ct);
        InvalidateMenuCache();
        return true;
    }

    public async Task<List<TastingMenuDto>> GetAllTastingMenusAsync(CancellationToken ct = default)
    {
        var list = await _context.TastingMenus
            .Include(m => m.TastingMenuItems)
                .ThenInclude(i => i.MenuItem)
            .AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);

        return list.Select(m => new TastingMenuDto(
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
    }

    private void InvalidateMenuCache()
    {
        _cache?.Remove(MenuService.CategoriesCacheKey);
        _cache?.Remove(MenuService.TastingMenusCacheKey);
    }
}
