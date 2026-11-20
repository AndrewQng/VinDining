using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/admin/tables")]
[Route("api/manager/tables")]
[Authorize(Roles = "Admin,Manager")]
public class AdminTableController : ApiControllerBase
{
    private readonly IAdminTableService _adminTableService;
    private readonly ITableService _tableService;

    public AdminTableController(IAdminTableService adminTableService, ITableService tableService)
    {
        _adminTableService = adminTableService;
        _tableService = tableService;
    }

    [HttpPut("layout")]
    public async Task<IActionResult> UpdateFloorPlanLayoutAsync([FromBody] UpdateFloorPlanDto dto, CancellationToken ct)
    {
        var count = await _adminTableService.UpdateFloorPlanLayoutAsync(dto, ct);
        var tables = await _tableService.GetFloorPlanAsync(ct);
        return Ok(new { success = true, updatedCount = count, message = "Cập nhật sơ đồ bàn thành công.", tables });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTableAsync([FromBody] CreateTableDto dto, CancellationToken ct)
    {
        var id = await _adminTableService.CreateTableAsync(dto, ct);
        var created = await _tableService.GetTableByIdAsync(id, ct);
        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            tableId = id,
            id,
            tableNumber = created.TableNumber,
            qrCode = created.QrCode,
            capacity = created.Capacity,
            zone = created.Zone,
            status = created.Status,
            posX = created.PosX,
            posY = created.PosY,
            isActive = created.IsActive,
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
        return Ok(new { success = result, deleted = result, message = "Xóa bàn thành công." });
    }
}
