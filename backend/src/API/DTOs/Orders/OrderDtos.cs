namespace API.DTOs;

public record CreateOrderDto(
    Guid TableId,
    Guid? ReservationId = null,
    Guid? StaffId = null,
    List<OrderItemRequestDto> Items = null!
);

public record OrderItemRequestDto(
    Guid MenuItemId,
    int Quantity,
    string? Note = null
);

public record FireCourseDto(
    CourseType CourseType
);

public record AddItemsDto(
    List<OrderItemRequestDto> Items
);

public record OrderDetailDto(
    Guid Id,
    Guid TableId,
    string TableNumber,
    OrderStatus Status,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    List<OrderItemDetailDto> Items
);

public record OrderItemDetailDto(
    Guid Id,
    Guid MenuItemId,
    string MenuItemName,
    decimal UnitPrice,
    int Quantity,
    OrderItemStatus Status,
    CourseType CourseType,
    DateTime? FiredAt,
    string? Note
);
