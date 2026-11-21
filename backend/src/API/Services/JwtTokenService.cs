using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using API.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

public class JwtTokenService : IJwtTokenService
{
    public const string DefaultDevSecret = "VinDiningFineDiningUltraSecretKeyForLocalDev2026_Minimum32CharsLength!";
    public const string DefaultIssuer = "VinDining";
    public const string DefaultAudience = "VinDiningClient";

    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment? _environment;

    public JwtTokenService(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        _configuration = configuration;
        _environment = environment;
    }

    public static string ResolveSecret(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        var envSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrWhiteSpace(envSecret))
            return envSecret;

        var configEnvSecret = configuration["JWT_SECRET"];
        if (!string.IsNullOrWhiteSpace(configEnvSecret))
            return configEnvSecret;

        var configSecret = configuration["Jwt:Secret"];
        if (!string.IsNullOrWhiteSpace(configSecret))
            return configSecret;

        if (environment != null && environment.IsDevelopment())
            return DefaultDevSecret;

        throw new InvalidOperationException(
            "JWT signing secret is not configured. Set the JWT_SECRET environment variable or Jwt:Secret configuration.");
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
        => ResolveSecret(_configuration, _environment);

    private string ResolveIssuer()
        => Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? _configuration["Jwt:Issuer"]
            ?? DefaultIssuer;

    private string ResolveAudience()
        => Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? _configuration["Jwt:Audience"]
            ?? DefaultAudience;
}
