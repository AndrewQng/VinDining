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
    int PrepTimeMinutes = 15,
    DateTime CreatedAt = default
)
{
    public int PreparationTimeMinutes => PrepTimeMinutes;
    public string Status => IsAvailable ? "Available" : "SoldOut";
}

public record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    List<MenuItemDto> Items,
    CourseType CourseType = CourseType.Appetizer,
    bool IsActive = true
);

public record CreateCategoryDto(
    string Name,
    string? Description = null
);

public record CreateMenuItemDto(
    string Name,
    decimal Price,
    string? Description = null,
    string? ImageUrl = null,
    bool IsAvailable = true,
    CourseType CourseType = CourseType.Appetizer,
    Guid CategoryId = default,
    int PrepTimeMinutes = 15,
    string? Status = null
);

public record UpdateMenuItemDto(
    string Name,
    decimal Price,
    string? Description = null,
    string? ImageUrl = null,
    bool IsAvailable = true,
    CourseType CourseType = CourseType.Appetizer,
    Guid CategoryId = default,
    int PrepTimeMinutes = 15,
    string? Status = null
);

public record ToggleAvailabilityDto(
    bool IsAvailable = true,
    string? Reason = null,
    string? Status = null
);

public record TastingMenuDto(
    Guid Id,
    string Name,
    decimal Price,
    string? Description,
    bool IsActive,
    List<TastingMenuItemDto> Items,
    string? ImageUrl = null,
    DateTime CreatedAt = default
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
    int SequenceOrder,
    Guid Id = default,
    Guid TastingMenuId = default,
    int PrepTimeMinutes = 15
)
{
    public int CourseOrder => SequenceOrder;
}

public record CreateTastingMenuDto(
    string Name,
    decimal Price,
    string? Description,
    List<CreateTastingMenuItemDto> Items,
    bool IsActive = true,
    string? ImageUrl = null
);

public record CreateTastingMenuItemDto(
    Guid MenuItemId,
    CourseType CourseType,
    int SequenceOrder = 0,
    int? CourseOrder = null
);

public record UpdateTastingMenuDto(
    string Name,
    decimal Price,
    string? Description,
    List<CreateTastingMenuItemDto> Items,
    bool IsActive = true,
    string? ImageUrl = null
);
