using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/admin/reservations")]
[Route("api/manager/reservations")]
[Authorize(Roles = "Admin,Manager")]
public class AdminRefundController : ApiControllerBase
{
    private readonly IRefundService _refundService;
    private readonly IApplicationDbContext _context;

    public AdminRefundController(IRefundService refundService, IApplicationDbContext context)
    {
        _refundService = refundService;
        _context = context;
    }

    [HttpPost("{id}/manual-refund")]
    public async Task<IActionResult> OverrideRefundAsync(Guid id, [FromBody] ManualRefundDto dto, CancellationToken ct)
    {
        var result = await _refundService.OverrideRefundAsync(id, dto, ct);
        var approved = dto.Approved ?? dto.IsApproved;
        var message = approved
            ? "Đã phê duyệt hoàn tiền cọc ngoại lệ thành công."
            : "Đã ghi nhận quyết định từ chối hoàn tiền cọc ngoại lệ.";

        var r = await _context.Reservations
            .Include(x => x.Guest)
            .Include(x => x.Table)
            .Include(x => x.Deposit)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (r != null)
        {
            var mapped = Services.ReservationService.MapToDetailDto(r);
            return Ok(new
            {
                success = result,
                message,
                id = mapped.Id,
                bookingCode = mapped.BookingCode,
                guest = mapped.Guest,
                tableId = mapped.TableId,
                tableNumber = mapped.TableNumber,
                zone = mapped.Zone,
                reservationTime = mapped.ReservationTime,
                partySize = mapped.PartySize,
                preOrderedTastingMenuId = mapped.PreOrderedTastingMenuId,
                preOrderedTastingMenuName = mapped.PreOrderedTastingMenuName,
                durationMinutes = mapped.DurationMinutes,
                status = approved ? "Cancelled_Refunded" : "RefundRejected",
                note = mapped.Note,
                cancelledAt = mapped.CancelledAt,
                cancelledReason = mapped.CancelledReason,
                holdExpiresAt = mapped.HoldExpiresAt,
                reminderSentAt = mapped.ReminderSentAt,
                createdAt = mapped.CreatedAt,
                deposit = mapped.Deposit
            });
        }

        return Ok(new { success = result, message });
    }

    [HttpGet("/api/admin/refunds")]
    [HttpGet("/api/manager/refunds")]
    public async Task<IActionResult> GetRefundRequestsAsync(CancellationToken ct)
    {
        var result = await _refundService.GetRefundRequestsAsync(ct);
        return Ok(result);
    }
}
