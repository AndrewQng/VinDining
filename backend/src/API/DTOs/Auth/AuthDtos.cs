namespace API.DTOs;

public record LoginDto(string Username, string Password);

public record AuthResponseDto(string Token, string Username, string FullName, string Role);
