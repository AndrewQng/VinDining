using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/admin/reports")]
[Route("api/manager/reports")]
[Authorize(Roles = "Admin,Manager")]
public class ReportController : ApiControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetMetricsAsync(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] TableZone? zone = null,
        [FromQuery] string? shift = null,
        [FromQuery] string? period = null,
        [FromQuery] string? label = null,
        CancellationToken ct = default)
    {
        var effectiveFrom = fromDate ?? from;
        var effectiveTo = toDate ?? to;
        var result = await _reportService.GetMetricsAsync(
            new DateRangeDto(effectiveFrom, effectiveTo, zone, shift, period, label),
            ct);
        return Ok(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportRevenueReportAsync(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] TableZone? zone = null,
        [FromQuery] string? shift = null,
        [FromQuery] string? period = null,
        [FromQuery] string? format = null,
        CancellationToken ct = default)
    {
        var effectiveFrom = fromDate ?? from;
        var effectiveTo = toDate ?? to;

        if (string.Equals(format, "excel", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedFormat = string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase) ? "pdf" : "excel";
            var ext = normalizedFormat == "pdf" ? "pdf" : "xlsx";
            return Ok(new
            {
                fileName = $"vindining-bao-cao-{DateTime.UtcNow:yyyy-MM-dd}.{ext}",
                format = normalizedFormat,
                generatedAt = DateTime.UtcNow.ToString("O")
            });
        }

        var bytes = await _reportService.ExportRevenueReportAsync(
            new DateRangeDto(effectiveFrom, effectiveTo, zone, shift, period),
            ct);
        return File(bytes, "text/csv; charset=utf-8", $"BaoCao_DoanhThu_{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
