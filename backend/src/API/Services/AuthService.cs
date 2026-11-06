using System.Security.Claims;
using API.Models.Common;
using API.Models.Entities;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public class AuthService : IAuthService
{
    private const int MaxFailedLoginAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher<Staff> _passwordHasher;
    private readonly IMemoryCache? _memoryCache;

    public AuthService(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        ICurrentUserService currentUserService,
        IPasswordHasher<Staff> passwordHasher,
        IMemoryCache? memoryCache = null)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
        _memoryCache = memoryCache;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            throw new UnauthorizedAccessException("Tài khoản và mật khẩu không được để trống.");

        var normalizedUsername = dto.Username.Trim().ToLowerInvariant();
        var lockKey = $"auth:lock:{normalizedUsername}";
        var failKey = $"auth:fail:{normalizedUsername}";

        if (_memoryCache != null && _memoryCache.TryGetValue<DateTimeOffset>(lockKey, out var lockedUntil) && lockedUntil > DateTimeOffset.UtcNow)
        {
            throw new AccountLockedException(
                "Tài khoản tạm thời bị khóa 15 phút do đăng nhập sai quá 5 lần liên tiếp.",
                lockedUntil);
        }

        var staff = await _context.Staffs
            .FirstOrDefaultAsync(s => s.Username == dto.Username.Trim(), ct);

        if (staff == null)
        {
            RecordFailedAttempt(failKey, lockKey);
            throw new UnauthorizedAccessException("Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (!staff.IsActive)
        {
            throw new UnauthorizedAccessException("Tài khoản nhân sự đã bị vô hiệu hóa.");
        }

        // Kiểm tra mật khẩu (hỗ trợ hash chuẩn Identity và nâng cấp an toàn cho dữ liệu seed dev)
        bool isValid = false;
        try
        {
            var verifyResult = _passwordHasher.VerifyHashedPassword(staff, staff.PasswordHash, dto.Password);
            isValid = verifyResult == PasswordVerificationResult.Success || verifyResult == PasswordVerificationResult.SuccessRehashNeeded;
            if (verifyResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                staff.PasswordHash = _passwordHasher.HashPassword(staff, dto.Password);
            }
        }
        catch (FormatException)
        {
            isValid = false;
        }

        if (!isValid && (staff.PasswordHash == dto.Password || (staff.PasswordHash == "hash123" && dto.Password == "hash123")))
        {
            isValid = true;
            staff.PasswordHash = _passwordHasher.HashPassword(staff, dto.Password);
        }

        if (!isValid)
        {
            RecordFailedAttempt(failKey, lockKey);
            throw new UnauthorizedAccessException("Tài khoản hoặc mật khẩu không chính xác.");
        }

        _memoryCache?.Remove(failKey);
        _memoryCache?.Remove(lockKey);

        var roleName = staff.Role.ToString();
        var token = _jwtTokenService.GenerateAccessToken(staff.Id, staff.Email, staff.FullName, new[] { roleName });
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(120);

        staff.RefreshToken = refreshToken;
        staff.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(ct);

        return new AuthResponseDto(token, staff.Username, staff.FullName, roleName, refreshToken, expiresAt);
    }

    private void RecordFailedAttempt(string failKey, string lockKey)
    {
        if (_memoryCache == null) return;

        var attempts = _memoryCache.TryGetValue<int>(failKey, out var current) ? current + 1 : 1;
        _memoryCache.Set(failKey, attempts, LockoutDuration);

        if (attempts >= MaxFailedLoginAttempts)
        {
            var until = DateTimeOffset.UtcNow.Add(LockoutDuration);
            _memoryCache.Set(lockKey, until, LockoutDuration);
            _memoryCache.Remove(failKey);
        }
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.RefreshToken))
            throw new UnauthorizedAccessException("Access Token hoặc Refresh Token không hợp lệ.");

        var principal = _jwtTokenService.GetPrincipalFromExpiredToken(dto.Token);
        if (principal == null)
            throw new UnauthorizedAccessException("Token không hợp lệ.");

        var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub")
            ?? principal.FindFirstValue("userId");

        if (!Guid.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("Token không chứa thông tin định danh hợp lệ.");

        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == userId && s.IsActive, ct);
        if (staff == null || staff.RefreshToken != dto.RefreshToken || staff.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh Token đã hết hạn hoặc không tồn tại.");
        }

        var roleName = staff.Role.ToString();
        var newAccessToken = _jwtTokenService.GenerateAccessToken(staff.Id, staff.Email, staff.FullName, new[] { roleName });
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(120);

        staff.RefreshToken = newRefreshToken;
        staff.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(ct);

        return new AuthResponseDto(newAccessToken, staff.Username, staff.FullName, roleName, newRefreshToken, expiresAt);
    }

    public async Task<StaffDto?> GetCurrentUserAsync(CancellationToken ct = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return null;

        var staff = await _context.Staffs.AsNoTracking().FirstOrDefaultAsync(s => s.Id == userId.Value, ct);
        if (staff == null) return null;

        return new StaffDto(staff.Id, staff.FullName, staff.Username, staff.Email, staff.Role, staff.IsActive);
    }

    public async Task LogoutAsync(CancellationToken ct = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return;

        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == userId.Value, ct);
        if (staff != null)
        {
            staff.RefreshToken = null;
            staff.RefreshTokenExpiryTime = null;
            await _context.SaveChangesAsync(ct);
        }
    }
}
