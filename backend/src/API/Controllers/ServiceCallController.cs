namespace API.Controllers;

[Route("api/service-calls")]
public class ServiceCallController : ApiControllerBase
{
    private readonly IServiceCallService _serviceCallService;

    public ServiceCallController(IServiceCallService serviceCallService)
    {
        _serviceCallService = serviceCallService;
    }

    [HttpPost("/api/tables/{id}/call-service")]
    public async Task<IActionResult> CreateServiceCallAsync(Guid id, [FromBody] ServiceCallDto dto, CancellationToken ct)
    {
        var requestId = await _serviceCallService.CreateServiceCallAsync(id, dto, ct);
        return Ok(new { success = true, requestId, message = "Đã gửi yêu cầu gọi phục vụ." });
    }

    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> CompleteServiceCallAsync(Guid id, CancellationToken ct)
    {
        var result = await _serviceCallService.CompleteServiceCallAsync(id, ct);
        return Ok(new { success = result, message = "Đã hoàn tất hỗ trợ yêu cầu." });
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveServiceCallsAsync(CancellationToken ct)
    {
        var result = await _serviceCallService.GetActiveServiceCallsAsync(ct);
        return Ok(result);
    }
}
