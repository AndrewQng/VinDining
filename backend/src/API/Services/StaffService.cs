using API.Models.Common;
using API.Models.Entities;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class StaffService : IStaffService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher<Staff> _passwordHasher;

    public StaffService(IApplicationDbContext context, IPasswordHasher<Staff> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> CreateStaffAsync(CreateStaffDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Họ tên nhân sự không được để trống.");
        if (string.IsNullOrWhiteSpace(dto.Username))
            throw new ArgumentException("Tên đăng nhập nhân sự không được để trống.");
        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new ArgumentException("Email nhân sự không được để trống.");

        var normalizedUsername = dto.Username.Trim();
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var existing = await _context.Staffs
            .AnyAsync(s => s.Username == normalizedUsername || s.Email == normalizedEmail, ct);

        if (existing)
            throw new ConflictException("Username hoặc Email nhân sự đã được sử dụng trên hệ thống.");

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? "0900000000" : dto.PhoneNumber.Trim(),
            Username = normalizedUsername,
            Email = normalizedEmail,
            Role = dto.Role,
            IsActive = true
        };

        var rawPassword = string.IsNullOrWhiteSpace(dto.Password) ? "Staff@123" : dto.Password;
        if (rawPassword.Length < 6)
            throw new ArgumentException("Mật khẩu khởi tạo phải có tối thiểu 6 ký tự.");

        staff.PasswordHash = _passwordHasher.HashPassword(staff, rawPassword);

        await _context.Staffs.AddAsync(staff, ct);
        await _context.SaveChangesAsync(ct);
        return staff.Id;
    }

    public async Task<bool> UpdateStaffAsync(Guid id, UpdateStaffDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Họ tên nhân sự không được để trống.");
        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new ArgumentException("Email nhân sự không được để trống.");

        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (staff == null)
            throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var emailDuplicate = await _context.Staffs
            .AnyAsync(s => s.Id != id && s.Email == normalizedEmail, ct);

        if (emailDuplicate)
            throw new ConflictException($"Email '{normalizedEmail}' đã thuộc về một nhân sự khác.");

        staff.FullName = dto.FullName.Trim();
        staff.Email = normalizedEmail;
        staff.Role = dto.Role;
        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            staff.PhoneNumber = dto.PhoneNumber.Trim();
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(Guid id, ResetPasswordDto dto, CancellationToken ct = default)
    {
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (staff == null)
            throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");

        var newPassword = string.IsNullOrWhiteSpace(dto.NewPassword) ? "Staff@123" : dto.NewPassword;
        if (newPassword.Length < 6)
            throw new ArgumentException("Mật khẩu mới phải có tối thiểu 6 ký tự.");

        staff.PasswordHash = _passwordHasher.HashPassword(staff, newPassword);
        staff.RefreshToken = null;
        staff.RefreshTokenExpiryTime = null;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, ToggleStatusDto dto, CancellationToken ct = default)
    {
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (staff == null)
            throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");

        staff.IsActive = dto.IsActive;
        if (!dto.IsActive)
        {
            // Revoke active refresh token session immediately when account is locked
            staff.RefreshToken = null;
            staff.RefreshTokenExpiryTime = null;
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<StaffDto>> GetStaffListAsync(CancellationToken ct = default)
    {
        var list = await _context.Staffs
            .AsNoTracking()
            .OrderBy(s => s.Role)
            .ThenBy(s => s.FullName)
            .ToListAsync(ct);

        return list.Select(s => new StaffDto(s.Id, s.FullName, s.Username, s.Email, s.Role, s.IsActive, s.PhoneNumber)).ToList();
    }

    public async Task<StaffDto> GetStaffByIdAsync(Guid id, CancellationToken ct = default)
    {
        var s = await _context.Staffs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s == null)
            throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");

        return new StaffDto(s.Id, s.FullName, s.Username, s.Email, s.Role, s.IsActive, s.PhoneNumber);
    }
}
