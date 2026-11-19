namespace API.DTOs;

public record StaffDto(
    Guid Id,
    string FullName,
    string Username,
    string Email,
    StaffRole Role,
    bool IsActive,
    string PhoneNumber = "",
    int FailedLoginCount = 0,
    DateTime? LockoutEnd = null,
    DateTime CreatedAt = default
);

public record CreateStaffDto(
    string FullName,
    string Username,
    string Password = "",
    string Email = "",
    StaffRole Role = StaffRole.Waitstaff,
    string PhoneNumber = "0900000000",
    string? InitialPassword = null
);

public record UpdateStaffDto(
    string FullName,
    string Email,
    StaffRole Role,
    string? PhoneNumber = null
);

public record ResetPasswordDto(
    string? NewPassword = null
);

public record ToggleStatusDto(
    bool IsActive
);
