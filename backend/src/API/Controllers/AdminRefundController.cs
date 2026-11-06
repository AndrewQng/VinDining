using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/admin/reservations")]
[Authorize(Roles = "Admin,Manager")]
public class AdminRefundController : ApiControllerBase
{
    private readonly IRefundService _refundService;

    public AdminRefundController(IRefundService refundService)
    {
        _refundService = refundService;
    }

    [HttpPost("{id}/manual-refund")]
    public async Task<IActionResult> OverrideRefundAsync(Guid id, [FromBody] ManualRefundDto dto, CancellationToken ct)
    {
        var result = await _refundService.OverrideRefundAsync(id, dto, ct);
        var message = dto.IsApproved
            ? "Đã phê duyệt hoàn tiền cọc ngoại lệ thành công."
            : "Đã ghi nhận quyết định từ chối hoàn tiền cọc ngoại lệ.";
        return Ok(new { success = result, message });
    }

    [HttpGet("/api/admin/refunds")]
    public async Task<IActionResult> GetRefundRequestsAsync(CancellationToken ct)
    {
        var result = await _refundService.GetRefundRequestsAsync(ct);
        return Ok(result);
    }
}
