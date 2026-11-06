using API.Models.Common;

namespace API.Services;

public class AdminTableService : IAdminTableService
{
    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier? _tableNotifier;

    public AdminTableService(IApplicationDbContext context, ITableNotifier? tableNotifier = null)
    {
        _context = context;
        _tableNotifier = tableNotifier;
    }

    public async Task<int> UpdateFloorPlanLayoutAsync(UpdateFloorPlanDto dto, CancellationToken ct = default)
    {
        if (dto.Tables == null || dto.Tables.Count == 0)
            return 0;

        var posLookup = dto.Tables
            .GroupBy(t => t.TableId)
            .ToDictionary(g => g.Key, g => g.Last());

        var tableIds = posLookup.Keys.ToList();
        var tables = await _context.Tables.Where(t => tableIds.Contains(t.Id)).ToListAsync(ct);

        foreach (var t in tables)
        {
            if (posLookup.TryGetValue(t.Id, out var pos))
            {
                if (pos.PosX < 0 || pos.PosY < 0)
                    throw new ArgumentException($"Tọa độ bàn {t.TableNumber} không được nhỏ hơn 0.");

                t.PosX = pos.PosX;
                t.PosY = pos.PosY;
            }
        }

        await _context.SaveChangesAsync(ct);
        if (_tableNotifier != null)
        {
            await _tableNotifier.NotifyFloorPlanUpdatedAsync(tables.Count, ct);
        }

        return tables.Count;
    }

    public async Task<Guid> CreateTableAsync(CreateTableDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.TableNumber))
            throw new ArgumentException("Số hiệu bàn không được để trống.");
        if (dto.Capacity <= 0)
            throw new ArgumentException("Sức chứa của bàn phải lớn hơn 0.");

        var normalizedNumber = dto.TableNumber.Trim();
        var exists = await _context.Tables
            .AnyAsync(t => t.TableNumber == normalizedNumber, ct);

        if (exists)
            throw new ConflictException($"Số hiệu bàn '{normalizedNumber}' đã tồn tại trên sơ đồ.");

        var table = new Table
        {
            Id = Guid.NewGuid(),
            TableNumber = normalizedNumber,
            Capacity = dto.Capacity,
            Zone = dto.Zone,
            Status = TableStatus.Available,
            IsActive = true,
            PosX = Math.Max(0, dto.PosX),
            PosY = Math.Max(0, dto.PosY)
        };

        await _context.Tables.AddAsync(table, ct);
        await _context.SaveChangesAsync(ct);

        if (_tableNotifier != null)
        {
            await _tableNotifier.NotifyFloorPlanUpdatedAsync(1, ct);
        }

        return table.Id;
    }

    public async Task<TableDto> UpdateTableAsync(Guid id, UpdateTableDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.TableNumber))
            throw new ArgumentException("Số hiệu bàn không được để trống.");
        if (dto.Capacity <= 0)
            throw new ArgumentException("Sức chứa của bàn phải lớn hơn 0.");

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        var normalizedNumber = dto.TableNumber.Trim();
        var duplicate = await _context.Tables
            .AnyAsync(t => t.Id != id && t.TableNumber == normalizedNumber, ct);

        if (duplicate)
            throw new ConflictException($"Số hiệu bàn '{normalizedNumber}' đã tồn tại trên sơ đồ.");

        if (!dto.IsActive && table.Status == TableStatus.Occupied)
            throw new InvalidOperationException($"Không thể ngưng hoạt động bàn {table.TableNumber} khi đang có khách dùng bữa.");

        table.TableNumber = normalizedNumber;
        table.Capacity = dto.Capacity;
        table.Zone = dto.Zone;
        table.PosX = Math.Max(0, dto.PosX);
        table.PosY = Math.Max(0, dto.PosY);
        table.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(ct);

        if (_tableNotifier != null)
        {
            await _tableNotifier.NotifyFloorPlanUpdatedAsync(1, ct);
        }

        return new TableDto(table.Id, table.TableNumber, table.Capacity, table.Zone, table.Status, table.PosX, table.PosY, null, table.IsActive);
    }

    public async Task<bool> DeleteTableAsync(Guid id, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (table.Status == TableStatus.Occupied ||
            table.Status == TableStatus.Reserved ||
            table.Status == TableStatus.LockedForPayment)
        {
            throw new InvalidOperationException($"Không thể xóa bàn {table.TableNumber} đang ở trạng thái {table.Status}.");
        }

        var hasActiveReservationOrOrder = await _context.Reservations
                .AnyAsync(r => r.TableId == id && (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed), ct)
            || await _context.Orders
                .AnyAsync(o => o.TableId == id && o.Status == OrderStatus.Processing, ct);

        if (hasActiveReservationOrOrder)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang có đơn đặt bàn hoặc đơn phục vụ chưa đóng, không thể xóa.");

        // If historical completed orders/reservations exist, soft-deactivate to preserve foreign-key audit history; otherwise remove cleanly
        var hasHistory = await _context.Reservations.AnyAsync(r => r.TableId == id, ct)
            || await _context.Orders.AnyAsync(o => o.TableId == id, ct);

        if (hasHistory)
        {
            table.IsActive = false;
        }
        else
        {
            _context.Tables.Remove(table);
        }

        await _context.SaveChangesAsync(ct);

        if (_tableNotifier != null)
        {
            await _tableNotifier.NotifyFloorPlanUpdatedAsync(1, ct);
        }

        return true;
    }
}
