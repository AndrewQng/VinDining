namespace API.Services;

public class AdminTableService : IAdminTableService
{
    private readonly IApplicationDbContext _context;

    public AdminTableService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> UpdateFloorPlanLayoutAsync(UpdateFloorPlanDto dto, CancellationToken ct = default)
    {
        var tableIds = dto.Tables.Select(t => t.TableId).ToList();
        var tables = await _context.Tables.Where(t => tableIds.Contains(t.Id)).ToListAsync(ct);

        foreach (var t in tables)
        {
            var pos = dto.Tables.FirstOrDefault(x => x.TableId == t.Id);
            if (pos != null)
            {
                t.PosX = pos.PosX;
                t.PosY = pos.PosY;
            }
        }

        await _context.SaveChangesAsync(ct);
        return tables.Count;
    }

    public async Task<Guid> CreateTableAsync(CreateTableDto dto, CancellationToken ct = default)
    {
        var table = new Table
        {
            Id = Guid.NewGuid(),
            TableNumber = dto.TableNumber,
            Capacity = dto.Capacity,
            Zone = dto.Zone,
            Status = TableStatus.Available,
            PosX = dto.PosX,
            PosY = dto.PosY
        };

        await _context.Tables.AddAsync(table, ct);
        await _context.SaveChangesAsync(ct);
        return table.Id;
    }

    public async Task<bool> DeleteTableAsync(Guid id, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        _context.Tables.Remove(table);
        await _context.SaveChangesAsync(ct);
        return true;
    }
}
