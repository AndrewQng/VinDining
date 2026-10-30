namespace API.Services.Interfaces;

public interface IStaffService
{
    Task<Guid> CreateStaffAsync(CreateStaffDto dto, CancellationToken ct = default);
    Task<bool> UpdateStaffAsync(Guid id, UpdateStaffDto dto, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(Guid id, ResetPasswordDto dto, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(Guid id, ToggleStatusDto dto, CancellationToken ct = default);
    Task<List<StaffDto>> GetStaffListAsync(CancellationToken ct = default);
    Task<StaffDto> GetStaffByIdAsync(Guid id, CancellationToken ct = default);
}
