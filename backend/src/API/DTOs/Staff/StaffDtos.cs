namespace API.DTOs;

public record StaffDto(
    Guid Id,
    string FullName,
    string Username,
    string Email,
    StaffRole Role,
    bool IsActive
);

public record CreateStaffDto(
    string FullName,
    string Username,
    string Password,
    string Email,
    StaffRole Role
);

public record UpdateStaffDto(
    string FullName,
    string Email,
    StaffRole Role
);

public record ResetPasswordDto(
    string NewPassword
);

public record ToggleStatusDto(
    bool IsActive
);
