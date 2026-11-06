namespace API.DTOs;

public record StaffDto(
    Guid Id,
    string FullName,
    string Username,
    string Email,
    StaffRole Role,
    bool IsActive,
    string PhoneNumber = ""
);

public record CreateStaffDto(
    string FullName,
    string Username,
    string Password,
    string Email,
    StaffRole Role,
    string PhoneNumber = "0900000000"
);

public record UpdateStaffDto(
    string FullName,
    string Email,
    StaffRole Role,
    string? PhoneNumber = null
);

public record ResetPasswordDto(
    string NewPassword
);

public record ToggleStatusDto(
    bool IsActive
);
