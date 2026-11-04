namespace API.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken ct = default);
    Task<StaffDto?> GetCurrentUserAsync(CancellationToken ct = default);
    Task LogoutAsync(CancellationToken ct = default);
}
