namespace API.DTOs;

public record LoginDto(string Username, string Password);

public record RefreshTokenRequestDto(string Token, string RefreshToken);

public record CurrentUserProfileDto(
    Guid Id,
    string Username,
    string FullName,
    string Email,
    string PhoneNumber,
    string Role
);

public record AuthResponseDto(
    string Token,
    string Username,
    string FullName,
    string Role,
    string? RefreshToken = null,
    DateTime? ExpiresAt = null,
    CurrentUserProfileDto? User = null)
{
    public DateTime? ExpiresAtUtc => ExpiresAt;
}
