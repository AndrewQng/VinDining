using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.Data;
using API.DTOs;
using API.Models.Entities;
using API.Models.Enums;
using API.Services;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace UnitTests;

public class AuthServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<Staff> _passwordHasher;
    private readonly JwtTokenService _jwtTokenService;

    public AuthServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"Jwt:Secret", "TestSecretKeyForVinDiningDevOnly2026_Minimum32CharsLength!"},
            {"Jwt:Issuer", "VinDiningTest"},
            {"Jwt:Audience", "VinDiningTestClient"},
            {"Jwt:ExpiryMinutes", "60"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _passwordHasher = new PasswordHasher<Staff>();
        _jwtTokenService = new JwtTokenService(_configuration);
    }

    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private class TestCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public bool IsAuthenticated => UserId.HasValue;
    }

    [Fact]
    public async Task LoginAsync_WithValidPassword_ReturnsSuccessWithJwtToken()
    {
        // Arrange
        using var context = CreateContext();
        var currentUserService = new TestCurrentUserService();
        var authService = new AuthService(context, _jwtTokenService, currentUserService, _passwordHasher);

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = "Nguyễn Văn Phục Vụ",
            PhoneNumber = "0901234567",
            Username = "waiter1",
            Email = "waiter1@vindining.vn",
            Role = StaffRole.Waitstaff,
            IsActive = true
        };
        staff.PasswordHash = _passwordHasher.HashPassword(staff, "SecurePassword123");
        await context.Staffs.AddAsync(staff);
        await context.SaveChangesAsync();

        var loginDto = new LoginDto("waiter1", "SecurePassword123");

        // Act
        var result = await authService.LoginAsync(loginDto);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("waiter1", result.Username);
        Assert.Equal("Nguyễn Văn Phục Vụ", result.FullName);
        Assert.Equal("Waitstaff", result.Role);
        Assert.NotEmpty(result.RefreshToken!);

        // Verify token can be parsed and claims match
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(result.Token);
        Assert.Equal("VinDiningTest", jwtToken.Issuer);
        Assert.Contains(jwtToken.Claims, c => (c.Type == "role" || c.Type == ClaimTypes.Role) && c.Value == "Waitstaff");
        Assert.Contains(jwtToken.Claims, c => c.Type == "sub" && c.Value == staff.Id.ToString());
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = CreateContext();
        var currentUserService = new TestCurrentUserService();
        var authService = new AuthService(context, _jwtTokenService, currentUserService, _passwordHasher);

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = "Admin User",
            PhoneNumber = "0900000000",
            Username = "admin",
            Email = "admin@vindining.vn",
            Role = StaffRole.Admin,
            IsActive = true
        };
        staff.PasswordHash = _passwordHasher.HashPassword(staff, "CorrectPassword");
        await context.Staffs.AddAsync(staff);
        await context.SaveChangesAsync();

        var loginDto = new LoginDto("admin", "WrongPassword");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(loginDto));
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = CreateContext();
        var currentUserService = new TestCurrentUserService();
        var authService = new AuthService(context, _jwtTokenService, currentUserService, _passwordHasher);

        var loginDto = new LoginDto("unknown_user", "AnyPassword");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(loginDto));
    }

    [Fact]
    public async Task LoginAsync_WithInactiveStaff_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = CreateContext();
        var currentUserService = new TestCurrentUserService();
        var authService = new AuthService(context, _jwtTokenService, currentUserService, _passwordHasher);

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = "Khóa Tài Khoản",
            PhoneNumber = "0909999999",
            Username = "locked_user",
            Email = "locked@vindining.vn",
            Role = StaffRole.Waitstaff,
            IsActive = false // INACTIVE
        };
        staff.PasswordHash = _passwordHasher.HashPassword(staff, "ValidPassword");
        await context.Staffs.AddAsync(staff);
        await context.SaveChangesAsync();

        var loginDto = new LoginDto("locked_user", "ValidPassword");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(loginDto));
    }

    [Fact]
    public async Task RefreshTokenAsync_WithValidRefreshToken_IssuesNewTokens()
    {
        // Arrange
        using var context = CreateContext();
        var currentUserService = new TestCurrentUserService();
        var authService = new AuthService(context, _jwtTokenService, currentUserService, _passwordHasher);

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = "Điều Phối Pass",
            PhoneNumber = "0908888888",
            Username = "expediter1",
            Email = "expediter@vindining.vn",
            Role = StaffRole.Expediter,
            IsActive = true
        };
        staff.PasswordHash = _passwordHasher.HashPassword(staff, "Pass123");
        await context.Staffs.AddAsync(staff);
        await context.SaveChangesAsync();

        // 1. Login to get initial tokens
        var initialAuth = await authService.LoginAsync(new LoginDto("expediter1", "Pass123"));
        Assert.NotNull(initialAuth.RefreshToken);

        // 2. Request refresh
        var refreshDto = new RefreshTokenRequestDto(initialAuth.Token, initialAuth.RefreshToken);
        var refreshedAuth = await authService.RefreshTokenAsync(refreshDto);

        // Assert
        Assert.NotNull(refreshedAuth);
        Assert.NotEmpty(refreshedAuth.Token);
        Assert.NotEmpty(refreshedAuth.RefreshToken!);
        Assert.NotEqual(initialAuth.RefreshToken, refreshedAuth.RefreshToken); // New refresh token rotation
        Assert.Equal("Expediter", refreshedAuth.Role);
    }

    [Fact]
    public async Task GetCurrentUserAsync_WhenAuthenticated_ReturnsStaffDto()
    {
        // Arrange
        using var context = CreateContext();
        var staffId = Guid.NewGuid();
        var currentUserService = new TestCurrentUserService { UserId = staffId };
        var authService = new AuthService(context, _jwtTokenService, currentUserService, _passwordHasher);

        var staff = new Staff
        {
            Id = staffId,
            FullName = "Trần Quản Lý",
            PhoneNumber = "0901112223",
            Username = "manager_test",
            Email = "manager@vindining.vn",
            Role = StaffRole.Admin,
            IsActive = true
        };
        await context.Staffs.AddAsync(staff);
        await context.SaveChangesAsync();

        // Act
        var result = await authService.GetCurrentUserAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(staffId, result.Id);
        Assert.Equal("Trần Quản Lý", result.FullName);
        Assert.Equal("manager_test", result.Username);
        Assert.Equal(StaffRole.Admin, result.Role);
    }
}
