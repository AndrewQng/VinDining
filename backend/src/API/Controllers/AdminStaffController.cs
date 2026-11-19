using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace API.Controllers;

[Route("api/admin/staff")]
[Route("api/manager/staff")]
[Authorize(Roles = "Admin,Manager")]
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
        var staff = await _staffService.GetStaffByIdAsync(id, ct);
        var temporaryPassword = !string.IsNullOrWhiteSpace(dto.Password)
            ? dto.Password
            : !string.IsNullOrWhiteSpace(dto.InitialPassword)
                ? dto.InitialPassword
                : "Staff@123";
        return StatusCode(StatusCodes.Status201Created, new
        {
            id = staff.Id,
            success = true,
            fullName = staff.FullName,
            phoneNumber = staff.PhoneNumber,
            username = staff.Username,
            email = staff.Email,
            role = staff.Role,
            isActive = staff.IsActive,
            failedLoginCount = staff.FailedLoginCount,
            lockoutEnd = staff.LockoutEnd,
            createdAt = staff.CreatedAt,
            temporaryPassword
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStaffAsync(Guid id, [FromBody] UpdateStaffDto dto, CancellationToken ct)
    {
        var result = await _staffService.UpdateStaffAsync(id, dto, ct);
        var staff = await _staffService.GetStaffByIdAsync(id, ct);
        return Ok(new
        {
            success = result,
            message = "Cập nhật nhân viên thành công.",
            id = staff.Id,
            fullName = staff.FullName,
            phoneNumber = staff.PhoneNumber,
            username = staff.Username,
            email = staff.Email,
            role = staff.Role,
            isActive = staff.IsActive,
            failedLoginCount = staff.FailedLoginCount,
            lockoutEnd = staff.LockoutEnd,
            createdAt = staff.CreatedAt
        });
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPasswordAsync(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] ResetPasswordDto? dto,
        CancellationToken ct)
    {
        var effectiveDto = dto ?? new ResetPasswordDto(null);
        var result = await _staffService.ResetPasswordAsync(id, effectiveDto, ct);
        var temporaryPassword = string.IsNullOrWhiteSpace(effectiveDto.NewPassword) ? "Staff@123" : effectiveDto.NewPassword;
        return Ok(new { success = result, temporaryPassword, message = "Cấp lại mật khẩu thành công." });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatusAsync(Guid id, [FromBody] ToggleStatusDto dto, CancellationToken ct)
    {
        var result = await _staffService.UpdateStatusAsync(id, dto, ct);
        var staff = await _staffService.GetStaffByIdAsync(id, ct);
        return Ok(new
        {
            success = result,
            message = "Cập nhật trạng thái tài khoản thành công.",
            id = staff.Id,
            fullName = staff.FullName,
            phoneNumber = staff.PhoneNumber,
            username = staff.Username,
            email = staff.Email,
            role = staff.Role,
            isActive = staff.IsActive,
            failedLoginCount = staff.FailedLoginCount,
            lockoutEnd = staff.LockoutEnd,
            createdAt = staff.CreatedAt
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetStaffListAsync(
        [FromQuery] StaffRole? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _staffService.GetStaffListAsync(ct);
        if (role.HasValue)
        {
            result = result.Where(s => s.Role == role.Value).ToList();
        }
        if (isActive.HasValue)
        {
            result = result.Where(s => s.IsActive == isActive.Value).ToList();
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim();
            result = result.Where(s =>
                s.FullName.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.Email.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.Username.Contains(q, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStaffByIdAsync(Guid id, CancellationToken ct)
    {
        var result = await _staffService.GetStaffByIdAsync(id, ct);
        return Ok(result);
    }
}
