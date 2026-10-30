namespace API.Controllers;

[Route("api/admin/tables")]
public class AdminTableController : ApiControllerBase
{
    private readonly IAdminTableService _adminTableService;

    public AdminTableController(IAdminTableService adminTableService)
    {
        _adminTableService = adminTableService;
    }

    [HttpPut("layout")]
    public async Task<IActionResult> UpdateFloorPlanLayoutAsync([FromBody] UpdateFloorPlanDto dto, CancellationToken ct)
    {
        var count = await _adminTableService.UpdateFloorPlanLayoutAsync(dto, ct);
        return Ok(new { success = true, updatedCount = count, message = "Cập nhật sơ đồ bàn thành công." });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTableAsync([FromBody] CreateTableDto dto, CancellationToken ct)
    {
        var id = await _adminTableService.CreateTableAsync(dto, ct);
        return Ok(new { success = true, tableId = id, message = "Tạo bàn mới thành công." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTableAsync(Guid id, CancellationToken ct)
    {
        var result = await _adminTableService.DeleteTableAsync(id, ct);
        return Ok(new { success = result, message = "Xóa bàn thành công." });
    }
}
