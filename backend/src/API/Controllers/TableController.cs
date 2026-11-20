using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/tables")]
[Authorize]
public class TableController : ApiControllerBase
{
    private readonly ITableService _tableService;
    private readonly IOrderService _orderService;
    private readonly IReservationService _reservationService;

    public TableController(
        ITableService tableService,
        IOrderService orderService,
        IReservationService reservationService)
    {
        _tableService = tableService;
        _orderService = orderService;
        _reservationService = reservationService;
    }

    [HttpPost("{id}/check-in")]
    [Authorize(Roles = "Waitstaff,Cashier,Admin,Manager")]
    public async Task<IActionResult> CheckInReservationAsync(Guid id, [FromBody] CheckInDto dto, CancellationToken ct)
    {
        var result = await _tableService.CheckInReservationAsync(id, dto, ct);
        var table = await _tableService.GetTableByIdAsync(id, ct);
        var order = await _orderService.GetActiveOrderByTableAsync(id, ct);
        return Ok(new
        {
            success = result,
            message = "Check-in nhận bàn thành công.",
            table,
            order
        });
    }

    [HttpPost("{id}/walk-in")]
    [Authorize(Roles = "Waitstaff,Cashier,Admin,Manager")]
    public async Task<IActionResult> CheckInWalkInAsync(Guid id, [FromBody] WalkInDto dto, CancellationToken ct)
    {
        var result = await _tableService.CheckInWalkInAsync(id, dto, ct);
        var table = await _tableService.GetTableByIdAsync(id, ct);
        return Ok(new
        {
            success = true,
            tableId = result,
            message = "Mở bàn trực tiếp cho thực khách thành công.",
            id = table.Id,
            tableNumber = table.TableNumber,
            qrCode = table.QrCode,
            capacity = table.Capacity,
            zone = table.Zone,
            status = table.Status,
            posX = table.PosX,
            posY = table.PosY,
            isActive = table.IsActive,
            assignedStaffId = table.AssignedStaffId,
            assignedStaffName = table.AssignedStaffName,
            currentOrderId = table.CurrentOrderId,
            currentReservationCode = table.CurrentReservationCode,
            guestCount = dto.GuestCount ?? dto.PartySize,
            holdExpiresAt = table.HoldExpiresAt,
            checkoutRequestedAt = table.CheckoutRequestedAt
        });
    }

    [HttpPost("{sourceId}/transfer")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> TransferTableAsync(Guid sourceId, [FromBody] TransferTableDto dto, CancellationToken ct)
    {
        var result = await _tableService.TransferTableAsync(sourceId, dto, ct);
        var sourceTable = await _tableService.GetTableByIdAsync(sourceId, ct);
        var targetTable = await _tableService.GetTableByIdAsync(dto.TargetTableId, ct);
        return Ok(new
        {
            success = result,
            message = "Điều chuyển bàn thành công.",
            sourceTable,
            targetTable
        });
    }

    [HttpPost("merge")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> MergeTablesAsync([FromBody] MergeTablesDto dto, CancellationToken ct)
    {
        var result = await _tableService.MergeTablesAsync(dto, ct);
        return Ok(new { success = result, message = "Gộp bàn thành công." });
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetFloorPlanAsync(CancellationToken ct)
    {
        var result = await _tableService.GetFloorPlanAsync(ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTableByIdAsync(Guid id, CancellationToken ct)
    {
        var table = await _tableService.GetTableByIdAsync(id, ct);
        var activeOrder = await _orderService.GetActiveOrderByTableAsync(id, ct);
        ReservationDetailDto? activeReservation = null;
        if (!string.IsNullOrWhiteSpace(table.CurrentReservationCode))
        {
            try
            {
                activeReservation = await _reservationService.GetReservationByCodeAsync(table.CurrentReservationCode!, ct);
            }
            catch
            {
                // Ignore if reservation code is synthetic or not found
            }
        }

        return Ok(new
        {
            id = table.Id,
            tableNumber = table.TableNumber,
            qrCode = table.QrCode,
            capacity = table.Capacity,
            zone = table.Zone,
            status = table.Status,
            posX = table.PosX,
            posY = table.PosY,
            currentOrderId = table.CurrentOrderId,
            isActive = table.IsActive,
            assignedStaffId = table.AssignedStaffId,
            assignedStaffName = table.AssignedStaffName,
            currentReservationCode = table.CurrentReservationCode,
            guestCount = table.GuestCount,
            holdExpiresAt = table.HoldExpiresAt,
            checkoutRequestedAt = table.CheckoutRequestedAt,
            table,
            activeOrder,
            activeReservation
        });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Waitstaff,Cashier,Admin,Manager")]
    public async Task<IActionResult> UpdateTableStatusAsync(Guid id, [FromBody] UpdateTableStatusDto dto, CancellationToken ct)
    {
        var result = await _tableService.UpdateTableStatusAsync(id, dto, ct);
        var table = await _tableService.GetTableByIdAsync(id, ct);
        return Ok(new
        {
            success = result,
            message = "Cập nhật trạng thái bàn thành công.",
            id = table.Id,
            tableNumber = table.TableNumber,
            qrCode = table.QrCode,
            capacity = table.Capacity,
            zone = table.Zone,
            status = table.Status,
            posX = table.PosX,
            posY = table.PosY,
            isActive = table.IsActive,
            assignedStaffId = table.AssignedStaffId,
            assignedStaffName = table.AssignedStaffName,
            currentOrderId = table.CurrentOrderId,
            currentReservationCode = table.CurrentReservationCode,
            guestCount = table.GuestCount,
            holdExpiresAt = table.HoldExpiresAt,
            checkoutRequestedAt = table.CheckoutRequestedAt
        });
    }
}
