namespace API.DTOs;

public record DateRangeDto(
    DateTime? FromDate = null,
    DateTime? ToDate = null
);

public record DashboardMetricsDto(
    decimal TotalRevenue,
    int TotalOrders,
    int TotalReservations,
    double OccupancyRate,
    List<TopSellingItemDto> TopSellingItems
);

public record TopSellingItemDto(
    string MenuItemName,
    int QuantitySold,
    decimal Revenue
);
