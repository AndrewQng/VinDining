namespace API.DTOs;

public record CreateOrderDto(
    Guid TableId,
    Guid? ReservationId = null,
    Guid? StaffId = null,
    List<OrderItemRequestDto>? Items = null,
    List<OrderTastingMenuRequestDto>? TastingMenus = null,
    bool IsPriority = false
);

public record OrderItemRequestDto(
    Guid MenuItemId,
    int Quantity,
    string? Note = null,
    Guid? TastingMenuId = null
);

public record OrderTastingMenuRequestDto(
    Guid TastingMenuId,
    int Quantity,
    string? Note = null
);

public record FireCourseDto(
    CourseType CourseType,
    bool IsPriority = false
);

public record AddItemsDto(
    List<OrderItemRequestDto> Items,
    bool? FireImmediately = null
);

public record RemakeItemDto(
    string? Reason = "Yêu cầu chế biến lại từ quầy Pass"
);

public record CancelItemDto(
    string? Reason = null
);

public record OrderDetailDto(
    Guid Id,
    Guid TableId,
    string TableNumber,
    OrderStatus Status,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    List<OrderItemDetailDto> Items,
    Guid? ReservationId = null,
    bool IsPriority = false
)
{
    public Guid OrderId => Id;
}

public record OrderItemDetailDto(
    Guid Id,
    Guid MenuItemId,
    string MenuItemName,
    decimal UnitPrice,
    int Quantity,
    OrderItemStatus Status,
    CourseType CourseType,
    DateTime? FiredAt,
    string? Note,
    Guid OrderId = default,
    string TableNumber = "",
    bool IsRush = false,
    int PrepTimeMinutes = 15,
    DateTime? ServedAt = null,
    Guid? TastingMenuId = null
)
{
    public int ElapsedSeconds => FiredAt.HasValue && Status == OrderItemStatus.Preparing
        ? Math.Max(0, (int)(DateTime.UtcNow - FiredAt.Value).TotalSeconds)
        : 0;

    public string SlaStatus
    {
        get
        {
            if (Status != OrderItemStatus.Preparing || !FiredAt.HasValue || PrepTimeMinutes <= 0)
                return "Normal";

            var limitSeconds = PrepTimeMinutes * 60.0;
            var ratio = ElapsedSeconds / limitSeconds;
            if (ratio >= 1.0) return "Overdue";
            if (ratio >= 0.8) return "Warning";
            return "Normal";
        }
    }
}
