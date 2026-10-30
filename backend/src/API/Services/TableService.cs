namespace API.Services;

public class TableService : ITableService
{
    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier _tableNotifier;

    public TableService(IApplicationDbContext context, ITableNotifier tableNotifier)
    {
        _context = context;
        _tableNotifier = tableNotifier;
    }

    public async Task<bool> CheckInReservationAsync(Guid id, CheckInDto dto, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        Reservation? reservation = null;
        if (!string.IsNullOrEmpty(dto.BookingCode))
        {
            reservation = await _context.Reservations.FirstOrDefaultAsync(r => r.BookingCode == dto.BookingCode, ct);
        }
        else if (dto.ReservationId.HasValue)
        {
            reservation = await _context.Reservations.FirstOrDefaultAsync(r => r.Id == dto.ReservationId.Value, ct);
        }

        if (reservation != null)
        {
            reservation.Status = ReservationStatus.Completed;
        }

        table.Status = TableStatus.Occupied;
        await _context.SaveChangesAsync(ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        return true;
    }

    public async Task<Guid> CheckInWalkInAsync(Guid id, WalkInDto dto, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (table.Status != TableStatus.Available)
            throw new InvalidOperationException($"Bàn {table.TableNumber} không ở trạng thái trống.");

        var guest = new Guest
        {
            Id = Guid.NewGuid(),
            FullName = dto.GuestName,
            PhoneNumber = dto.PhoneNumber,
            CreatedAt = DateTime.UtcNow
        };
        await _context.Guests.AddAsync(guest, ct);

        table.Status = TableStatus.Occupied;
        await _context.SaveChangesAsync(ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);

        return table.Id;
    }

    public async Task<bool> TransferTableAsync(Guid sourceId, TransferTableDto dto, CancellationToken ct = default)
    {
        var sourceTable = await _context.Tables.FirstOrDefaultAsync(t => t.Id == sourceId, ct);
        var targetTable = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TargetTableId, ct);

        if (sourceTable == null || targetTable == null)
            throw new KeyNotFoundException("Bàn nguồn hoặc bàn đích không tồn tại.");

        if (targetTable.Status != TableStatus.Available)
            throw new InvalidOperationException($"Bàn đích {targetTable.TableNumber} đang bận.");

        var activeOrder = await _context.Orders
            .FirstOrDefaultAsync(o => o.TableId == sourceId && o.Status == OrderStatus.Processing, ct);

        if (activeOrder != null)
        {
            activeOrder.TableId = targetTable.Id;
        }

        targetTable.Status = TableStatus.Occupied;
        sourceTable.Status = TableStatus.Cleaning;

        await _context.SaveChangesAsync(ct);

        await _tableNotifier.NotifyTableStatusChangedAsync(sourceTable.Id, sourceTable.TableNumber, sourceTable.Status, ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(targetTable.Id, targetTable.TableNumber, targetTable.Status, ct);

        return true;
    }

    public async Task<bool> MergeTablesAsync(MergeTablesDto dto, CancellationToken ct = default)
    {
        var tables = await _context.Tables.Where(t => dto.TableIds.Contains(t.Id)).ToListAsync(ct);
        foreach (var t in tables)
        {
            t.Status = TableStatus.Occupied;
            await _tableNotifier.NotifyTableStatusChangedAsync(t.Id, t.TableNumber, t.Status, ct);
        }
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<TableDto>> GetFloorPlanAsync(CancellationToken ct = default)
    {
        var tables = await _context.Tables.AsNoTracking().ToListAsync(ct);
        return tables.Select(t => new TableDto(t.Id, t.TableNumber, t.Capacity, t.Zone, t.Status, t.PosX, t.PosY)).ToList();
    }

    public async Task<TableDto> GetTableByIdAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t == null) throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");
        return new TableDto(t.Id, t.TableNumber, t.Capacity, t.Zone, t.Status, t.PosX, t.PosY);
    }

    public async Task<bool> UpdateTableStatusAsync(Guid id, UpdateTableStatusDto dto, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        table.Status = dto.Status;
        await _context.SaveChangesAsync(ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        return true;
    }
}
