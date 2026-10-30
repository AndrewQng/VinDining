namespace API.Controllers;

[Route("api/tables")]
public class TableController : ApiControllerBase
{
    private readonly ITableService _tableService;

    public TableController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpPost("{id}/check-in")]
    public async Task<IActionResult> CheckInReservationAsync(Guid id, [FromBody] CheckInDto dto, CancellationToken ct)
    {
        var result = await _tableService.CheckInReservationAsync(id, dto, ct);
        return Ok(new { success = result, message = "Check-in bàn thành công." });
    }

    [HttpPost("{id}/walk-in")]
    public async Task<IActionResult> CheckInWalkInAsync(Guid id, [FromBody] WalkInDto dto, CancellationToken ct)
    {
        var result = await _tableService.CheckInWalkInAsync(id, dto, ct);
        return Ok(new { success = true, tableId = result, message = "Xếp bàn vãng lai thành công." });
    }

    [HttpPost("{sourceId}/transfer")]
    public async Task<IActionResult> TransferTableAsync(Guid sourceId, [FromBody] TransferTableDto dto, CancellationToken ct)
    {
        var result = await _tableService.TransferTableAsync(sourceId, dto, ct);
        return Ok(new { success = result, message = "Điều chuyển bàn thành công." });
    }

    [HttpPost("merge")]
    public async Task<IActionResult> MergeTablesAsync([FromBody] MergeTablesDto dto, CancellationToken ct)
    {
        var result = await _tableService.MergeTablesAsync(dto, ct);
        return Ok(new { success = result, message = "Gộp bàn thành công." });
    }

    [HttpGet]
    public async Task<IActionResult> GetFloorPlanAsync(CancellationToken ct)
    {
        var result = await _tableService.GetFloorPlanAsync(ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTableByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _tableService.GetTableByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTableStatusAsync(Guid id, [FromBody] UpdateTableStatusDto dto, CancellationToken ct)
    {
        var result = await _tableService.UpdateTableStatusAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cập nhật trạng thái bàn thành công." });
    }
}
