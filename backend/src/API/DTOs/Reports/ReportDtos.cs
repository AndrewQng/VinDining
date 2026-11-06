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
    List<TopSellingItemDto> TopSellingItems,
    decimal LunchShiftRevenue = 0m,
    decimal DinnerShiftRevenue = 0m,
    decimal DeductedDepositTotal = 0m,
    decimal ForfeitedDepositRevenue = 0m,
    int CancelledReservationsCount = 0,
    double AverageRating = 0.0
);

public record TopSellingItemDto(
    string MenuItemName,
    int QuantitySold,
    decimal Revenue
);
