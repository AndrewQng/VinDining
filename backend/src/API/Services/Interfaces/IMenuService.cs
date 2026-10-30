namespace API.Services.Interfaces;

public interface IMenuService
{
    Task<List<CategoryDto>> GetTableMenuAsync(Guid tableId, CancellationToken ct = default);
    Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<MenuItemDto> GetMenuItemByIdAsync(Guid id, CancellationToken ct = default);
}
