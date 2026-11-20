namespace API.DTOs;

public record DateRangeDto(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    TableZone? Zone = null,
    string? Shift = null,
    string? Period = null,
    string? Label = null
);

public record RevenueSeriesPointDto(
    string Label,
    decimal Revenue,
    int Guests
);

public record BestSellerItemDto(
    string MenuItemId,
    string Name,
    int QuantitySold,
    decimal Revenue
);

public record ZoneRevenueDto(
    TableZone Zone,
    decimal Revenue,
    int GuestCount,
    int ReservationCount
);

public record ReportFeedbackSummaryDto(
    int Count,
    double AvgFood,
    double AvgAmbience,
    double AvgService
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
    double AverageRating = 0.0,
    string Period = "month",
    string From = "",
    string To = "",
    string PeriodLabel = "",
    bool HasData = false,
    int TotalGuests = 0,
    double CancellationRate = 0.0,
    List<RevenueSeriesPointDto>? RevenueSeries = null,
    List<BestSellerItemDto>? BestSellers = null,
    List<ZoneRevenueDto>? RevenueByZone = null,
    ReportFeedbackSummaryDto? FeedbackSummary = null
);

public record TopSellingItemDto(
    string MenuItemName,
    int QuantitySold,
    decimal Revenue,
    string MenuItemId = ""
)
{
    public string Name => MenuItemName;
}
