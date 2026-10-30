namespace API.Controllers;

[Route("api/admin/reports")]
public class ReportController : ApiControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetMetricsAsync([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, CancellationToken ct)
    {
        var result = await _reportService.GetMetricsAsync(new DateRangeDto(fromDate, toDate), ct);
        return Ok(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportRevenueReportAsync([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, CancellationToken ct)
    {
        var bytes = await _reportService.ExportRevenueReportAsync(new DateRangeDto(fromDate, toDate), ct);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BaoCao_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
