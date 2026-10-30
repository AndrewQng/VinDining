namespace API.Controllers;

[Route("api/admin/reservations")]
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
        return Ok(new { success = result, message = "Đã duyệt hoàn tiền cọc thủ công." });
    }

    [HttpGet("/api/admin/refunds")]
    public async Task<IActionResult> GetRefundRequestsAsync(CancellationToken ct)
    {
        var result = await _refundService.GetRefundRequestsAsync(ct);
        return Ok(result);
    }
}
