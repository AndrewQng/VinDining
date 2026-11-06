using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using API.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

public class JwtTokenService : IJwtTokenService
{
    public const string DefaultDevSecret = "VinDiningFineDiningUltraSecretKeyForLocalDev2026_Minimum32CharsLength!";
    public const string DefaultIssuer = "VinDining";
    public const string DefaultAudience = "VinDiningClient";

    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(Guid userId, string email, string fullName, IEnumerable<string> roles, IEnumerable<Claim>? customClaims = null)
    {
        var secret = ResolveSecret();
        var issuer = ResolveIssuer();
        var audience = ResolveAudience();
        var expiryRaw = _configuration["Jwt:ExpiryMinutes"] ?? Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES");
        var expiryMinutes = int.TryParse(expiryRaw, out var min) ? min : 120;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("name", fullName),
            new(ClaimTypes.Name, fullName),
            new("userId", userId.ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("role", role));
        }

        if (customClaims != null)
        {
            claims.AddRange(customClaims);
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secret = ResolveSecret();
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token algorithm");
        }

        return principal;
    }

    private string ResolveSecret()
        => _configuration["Jwt:Secret"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? DefaultDevSecret;

    private string ResolveIssuer()
        => _configuration["Jwt:Issuer"]
            ?? Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? DefaultIssuer;

    private string ResolveAudience()
        => _configuration["Jwt:Audience"]
            ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? DefaultAudience;
}
