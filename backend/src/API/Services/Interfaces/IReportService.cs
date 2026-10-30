namespace API.Services.Interfaces;

public interface IReportService
{
    Task<DashboardMetricsDto> GetMetricsAsync(DateRangeDto range, CancellationToken ct = default);
    Task<byte[]> ExportRevenueReportAsync(DateRangeDto range, CancellationToken ct = default);
}
