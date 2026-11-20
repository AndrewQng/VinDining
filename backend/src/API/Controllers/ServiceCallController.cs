using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/service-calls")]
[Authorize]
public class ServiceCallController : ApiControllerBase
{
    private readonly IServiceCallService _serviceCallService;

    public ServiceCallController(IServiceCallService serviceCallService)
    {
        _serviceCallService = serviceCallService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateFromBodyAsync([FromBody] ServiceCallDto dto, CancellationToken ct)
    {
        var requestId = await _serviceCallService.CreateServiceCallAsync(dto.TableId, dto, ct);
        var active = await _serviceCallService.GetActiveServiceCallsAsync(ct);
        var created = active.FirstOrDefault(s => s.Id == requestId);
        return Ok(new
        {
            success = true,
            requestId,
            message = "Đã gửi yêu cầu gọi phục vụ.",
            id = requestId,
            tableId = created?.TableId ?? dto.TableId,
            tableNumber = created?.TableNumber ?? "",
            requestType = created?.RequestType ?? dto.RequestType,
            status = created?.Status ?? "Pending",
            completedById = (Guid?)null,
            completedAt = (DateTime?)null,
            createdAt = created?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpPost("/api/tables/{id}/call-service")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateServiceCallAsync(Guid id, [FromBody] ServiceCallDto dto, CancellationToken ct)
    {
        var requestId = await _serviceCallService.CreateServiceCallAsync(id, dto, ct);
        var active = await _serviceCallService.GetActiveServiceCallsAsync(ct);
        var created = active.FirstOrDefault(s => s.Id == requestId);
        return Ok(new
        {
            success = true,
            requestId,
            message = "Đã gửi yêu cầu gọi phục vụ.",
            id = requestId,
            tableId = created?.TableId ?? id,
            tableNumber = created?.TableNumber ?? "",
            requestType = created?.RequestType ?? dto.RequestType,
            status = created?.Status ?? "Pending",
            completedById = (Guid?)null,
            completedAt = (DateTime?)null,
            createdAt = created?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpPatch("{id}/complete")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> CompleteServiceCallAsync(Guid id, CancellationToken ct)
    {
        var active = await _serviceCallService.GetActiveServiceCallsAsync(ct);
        var target = active.FirstOrDefault(s => s.Id == id);
        var result = await _serviceCallService.CompleteServiceCallAsync(id, ct);
        return Ok(new
        {
            success = result,
            message = "Đã hoàn tất hỗ trợ yêu cầu.",
            id,
            tableId = target?.TableId ?? Guid.Empty,
            tableNumber = target?.TableNumber ?? "",
            requestType = target?.RequestType ?? "",
            status = "Completed",
            completedAt = DateTime.UtcNow,
            createdAt = target?.CreatedAt ?? DateTime.UtcNow
        });
    }

    [HttpGet("active")]
    [Authorize(Roles = "Waitstaff,Admin,Manager")]
    public async Task<IActionResult> GetActiveServiceCallsAsync(CancellationToken ct)
    {
        var result = await _serviceCallService.GetActiveServiceCallsAsync(ct);
        return Ok(result);
    }
}
