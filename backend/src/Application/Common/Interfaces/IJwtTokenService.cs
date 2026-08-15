using System.Security.Claims;

namespace Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(Guid userId, string email, string fullName, IEnumerable<string> roles, IEnumerable<Claim>? customClaims = null);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
