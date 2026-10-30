namespace API.Controllers;

[Route("api/admin/staff")]
public class AdminStaffController : ApiControllerBase
{
    private readonly IStaffService _staffService;

    public AdminStaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateStaffAsync([FromBody] CreateStaffDto dto, CancellationToken ct)
    {
        var id = await _staffService.CreateStaffAsync(dto, ct);
        return CreatedAtAction(nameof(GetStaffByIdAsync), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStaffAsync(Guid id, [FromBody] UpdateStaffDto dto, CancellationToken ct)
    {
        var result = await _staffService.UpdateStaffAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cập nhật nhân viên thành công." });
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPasswordAsync(Guid id, [FromBody] ResetPasswordDto dto, CancellationToken ct)
    {
        var result = await _staffService.ResetPasswordAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cấp lại mật khẩu thành công." });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatusAsync(Guid id, [FromBody] ToggleStatusDto dto, CancellationToken ct)
    {
        var result = await _staffService.UpdateStatusAsync(id, dto, ct);
        return Ok(new { success = result, message = "Cập nhật trạng thái tài khoản thành công." });
    }

    [HttpGet]
    public async Task<IActionResult> GetStaffListAsync(CancellationToken ct)
    {
        var result = await _staffService.GetStaffListAsync(ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStaffByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _staffService.GetStaffByIdAsync(id, ct);
        return Ok(result);
    }
}
