namespace API.DTOs;

public record MenuItemDto(
    Guid Id,
    string Name,
    decimal Price,
    string? Description,
    string? ImageUrl,
    bool IsAvailable,
    CourseType CourseType,
    Guid CategoryId,
    string CategoryName,
    int PrepTimeMinutes = 15
)
{
    public int PreparationTimeMinutes => PrepTimeMinutes;
}

public record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    List<MenuItemDto> Items
);

public record CreateCategoryDto(
    string Name,
    string? Description = null
);

public record CreateMenuItemDto(
    string Name,
    decimal Price,
    string? Description,
    string? ImageUrl,
    bool IsAvailable,
    CourseType CourseType,
    Guid CategoryId,
    int PrepTimeMinutes = 15
);

public record UpdateMenuItemDto(
    string Name,
    decimal Price,
    string? Description,
    string? ImageUrl,
    bool IsAvailable,
    CourseType CourseType,
    Guid CategoryId,
    int PrepTimeMinutes = 15
);

public record ToggleAvailabilityDto(
    bool IsAvailable,
    string? Reason = null
);

public record TastingMenuDto(
    Guid Id,
    string Name,
    decimal Price,
    string? Description,
    bool IsActive,
    List<TastingMenuItemDto> Items
)
{
    public decimal TotalPrice => Price;
    public int CourseCount => Items.Count;
    public bool IsAvailable => IsActive;
}

public record TastingMenuItemDto(
    Guid MenuItemId,
    string MenuItemName,
    CourseType CourseType,
    int SequenceOrder
);

public record CreateTastingMenuDto(
    string Name,
    decimal Price,
    string? Description,
    List<CreateTastingMenuItemDto> Items,
    bool IsActive = true
);

public record CreateTastingMenuItemDto(
    Guid MenuItemId,
    CourseType CourseType,
    int SequenceOrder
);

public record UpdateTastingMenuDto(
    string Name,
    decimal Price,
    string? Description,
    List<CreateTastingMenuItemDto> Items,
    bool IsActive = true
);
