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
    string CategoryName
);

public record CategoryDto(
    Guid Id,
    string Name,
    string? Description,
    List<MenuItemDto> Items
);

public record CreateMenuItemDto(
    string Name,
    decimal Price,
    string? Description,
    string? ImageUrl,
    bool IsAvailable,
    CourseType CourseType,
    Guid CategoryId
);

public record UpdateMenuItemDto(
    string Name,
    decimal Price,
    string? Description,
    string? ImageUrl,
    bool IsAvailable,
    CourseType CourseType,
    Guid CategoryId
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
);

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
    List<CreateTastingMenuItemDto> Items
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
    List<CreateTastingMenuItemDto> Items
);
