namespace API.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ICurrentUserService _currentUserService;

    public AuthService(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _currentUserService = currentUserService;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var staff = await _context.Staffs
            .FirstOrDefaultAsync(s => s.Username == dto.Username && s.IsActive, ct);

        if (staff == null)
            throw new UnauthorizedAccessException("Tài khoản hoặc mật khẩu không chính xác.");

        var token = _jwtTokenService.GenerateAccessToken(staff.Id, staff.Email, staff.FullName, new[] { staff.Role.ToString() });

        return new AuthResponseDto(token, staff.Username, staff.FullName, staff.Role.ToString());
    }

    public async Task<StaffDto?> GetCurrentUserAsync(CancellationToken ct = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return null;

        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == userId.Value, ct);
        if (staff == null) return null;

        return new StaffDto(staff.Id, staff.FullName, staff.Username, staff.Email, staff.Role, staff.IsActive);
    }

    public Task LogoutAsync(CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
}
