using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/admin/tables")]
[Authorize(Roles = "Admin,Manager")]
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
        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            tableId = id,
            qrMenuUrl = $"/emenu/{id}",
            message = "Tạo bàn mới thành công."
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTableAsync(Guid id, [FromBody] UpdateTableDto dto, CancellationToken ct)
    {
        var updated = await _adminTableService.UpdateTableAsync(id, dto, ct);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTableAsync(Guid id, CancellationToken ct)
    {
        var result = await _adminTableService.DeleteTableAsync(id, ct);
        return Ok(new { success = result, message = "Xóa bàn thành công." });
    }
}
