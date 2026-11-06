namespace API.Services.Interfaces;

public interface IAdminMenuService
{
    Task<Guid> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken ct = default);
    Task<List<CategoryDto>> GetAllCategoriesAsync(CancellationToken ct = default);
    Task<Guid> CreateMenuItemAsync(CreateMenuItemDto dto, CancellationToken ct = default);
    Task<bool> UpdateMenuItemAsync(Guid id, UpdateMenuItemDto dto, CancellationToken ct = default);
    Task<bool> UpdateAvailabilityAsync(Guid id, ToggleAvailabilityDto dto, CancellationToken ct = default);
    Task<bool> DeleteMenuItemAsync(Guid id, CancellationToken ct = default);
    Task<List<MenuItemDto>> GetAllMenuItemsAsync(CancellationToken ct = default);
    Task<Guid> CreateTastingMenuAsync(CreateTastingMenuDto dto, CancellationToken ct = default);
    Task<bool> UpdateTastingMenuAsync(Guid id, UpdateTastingMenuDto dto, CancellationToken ct = default);
    Task<bool> DeleteTastingMenuAsync(Guid id, CancellationToken ct = default);
    Task<List<TastingMenuDto>> GetAllTastingMenusAsync(CancellationToken ct = default);
}
