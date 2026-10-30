namespace API.Services;

public class StaffService : IStaffService
{
    private readonly IApplicationDbContext _context;

    public StaffService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> CreateStaffAsync(CreateStaffDto dto, CancellationToken ct = default)
    {
        var existing = await _context.Staffs.AnyAsync(s => s.Username == dto.Username || s.Email == dto.Email, ct);
        if (existing) throw new InvalidOperationException("Username hoặc Email đã được sử dụng.");

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName,
            Username = dto.Username,
            Email = dto.Email,
            Role = dto.Role,
            IsActive = true
        };

        await _context.Staffs.AddAsync(staff, ct);
        await _context.SaveChangesAsync(ct);
        return staff.Id;
    }

    public async Task<bool> UpdateStaffAsync(Guid id, UpdateStaffDto dto, CancellationToken ct = default)
    {
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (staff == null) throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");

        staff.FullName = dto.FullName;
        staff.Email = dto.Email;
        staff.Role = dto.Role;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public Task<bool> ResetPasswordAsync(Guid id, ResetPasswordDto dto, CancellationToken ct = default)
    {
        return Task.FromResult(true);
    }

    public async Task<bool> UpdateStatusAsync(Guid id, ToggleStatusDto dto, CancellationToken ct = default)
    {
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (staff == null) throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");

        staff.IsActive = dto.IsActive;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<StaffDto>> GetStaffListAsync(CancellationToken ct = default)
    {
        var list = await _context.Staffs.AsNoTracking().ToListAsync(ct);
        return list.Select(s => new StaffDto(s.Id, s.FullName, s.Username, s.Email, s.Role, s.IsActive)).ToList();
    }

    public async Task<StaffDto> GetStaffByIdAsync(Guid id, CancellationToken ct = default)
    {
        var s = await _context.Staffs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s == null) throw new KeyNotFoundException($"Không tìm thấy nhân viên {id}.");
        return new StaffDto(s.Id, s.FullName, s.Username, s.Email, s.Role, s.IsActive);
    }
}
