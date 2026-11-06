using API.Models.Common;

namespace API.Services;

public class TableService : ITableService
{
    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;

    public TableService(
        IApplicationDbContext context,
        ITableNotifier tableNotifier,
        ITableConcurrencyLock? tableLock = null)
    {
        _context = context;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? DefaultTableLock;
    }

    public async Task<bool> CheckInReservationAsync(Guid id, CheckInDto dto, CancellationToken ct = default)
    {
        await using var lockHandle = await _tableLock.AcquireAsync(id, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng hoạt động.");

        if (table.Status == TableStatus.Occupied)
            throw new ConflictException($"Bàn {table.TableNumber} đang có khách dùng bữa.");

        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, chưa sẵn sàng nhận khách.");

        Reservation? reservation = null;
        if (!string.IsNullOrWhiteSpace(dto.BookingCode))
        {
            reservation = await _context.Reservations
                .Include(r => r.Table)
                .FirstOrDefaultAsync(r => r.BookingCode == dto.BookingCode.Trim(), ct);
        }
        else if (dto.ReservationId.HasValue)
        {
            reservation = await _context.Reservations
                .Include(r => r.Table)
                .FirstOrDefaultAsync(r => r.Id == dto.ReservationId.Value, ct);
        }
        else
        {
            reservation = await _context.Reservations
                .Include(r => r.Table)
                .Where(r => r.TableId == id && r.Status == ReservationStatus.Confirmed)
                .OrderBy(r => r.ReservationTime)
                .FirstOrDefaultAsync(ct);
        }

        if (reservation == null)
            throw new KeyNotFoundException("Không tìm thấy đơn đặt bàn hợp lệ để nhận bàn.");

        if (reservation.Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException($"Đơn đặt bàn {reservation.BookingCode} đang ở trạng thái {reservation.Status}, chỉ đơn đã xác nhận đặt cọc mới được nhận bàn.");

        if (table.Capacity < reservation.PartySize)
            throw new InvalidOperationException($"Bàn {table.TableNumber} (sức chứa {table.Capacity}) không đủ chỗ cho đoàn {reservation.PartySize} khách.");

        Table? previousTableToRelease = null;
        if (reservation.TableId != table.Id)
        {
            if (table.Status != TableStatus.Available)
                throw new ConflictException($"Bàn {table.TableNumber} đang được giữ cho đơn khác, không thể xếp khách sang bàn này.");

            if (reservation.Table != null && reservation.Table.Status == TableStatus.Reserved)
            {
                reservation.Table.Status = TableStatus.Available;
                previousTableToRelease = reservation.Table;
            }
            reservation.TableId = table.Id;
        }

        reservation.Status = ReservationStatus.Completed;
        table.Status = TableStatus.Occupied;

        await _context.SaveChangesAsync(ct);

        if (previousTableToRelease != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(previousTableToRelease.Id, previousTableToRelease.TableNumber, previousTableToRelease.Status, ct);
        }
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);

        return true;
    }

    public async Task<Guid> CheckInWalkInAsync(Guid id, WalkInDto dto, CancellationToken ct = default)
    {
        if (dto.PartySize <= 0)
            throw new ArgumentException("Số lượng khách vãng lai phải lớn hơn 0.");

        await using var lockHandle = await _tableLock.AcquireAsync(id, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng hoạt động.");

        if (table.Status != TableStatus.Available)
            throw new ConflictException($"Bàn {table.TableNumber} không ở trạng thái trống ({table.Status}).");

        if (table.Capacity < dto.PartySize)
            throw new InvalidOperationException($"Bàn {table.TableNumber} (sức chứa {table.Capacity}) nhỏ hơn số lượng khách vãng lai ({dto.PartySize}).");

        var now = DateTime.UtcNow;
        var upcomingWindow = now.AddMinutes(90);
        var hasUpcomingReservation = await _context.Reservations
            .AnyAsync(r => r.TableId == id &&
                           r.Status == ReservationStatus.Confirmed &&
                           r.ReservationTime >= now.AddMinutes(-15) &&
                           r.ReservationTime <= upcomingWindow, ct);

        if (hasUpcomingReservation)
            throw new ConflictException($"Bàn {table.TableNumber} có lịch đặt trước đã xác nhận trong vòng 90 phút tới, vui lòng xếp bàn khác.");

        var phone = dto.PhoneNumber?.Trim() ?? string.Empty;
        var guestName = string.IsNullOrWhiteSpace(dto.GuestName) ? "Khách vãng lai" : dto.GuestName.Trim();

        Guest? guest = null;
        if (!string.IsNullOrEmpty(phone))
        {
            guest = await _context.Guests.FirstOrDefaultAsync(g => g.PhoneNumber == phone, ct);
        }

        if (guest == null)
        {
            guest = new Guest
            {
                Id = Guid.NewGuid(),
                FullName = guestName,
                PhoneNumber = phone,
                CreatedAt = now
            };
            await _context.Guests.AddAsync(guest, ct);
        }

        table.Status = TableStatus.Occupied;
        await _context.SaveChangesAsync(ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);

        return table.Id;
    }

    public async Task<bool> TransferTableAsync(Guid sourceId, TransferTableDto dto, CancellationToken ct = default)
    {
        if (sourceId == dto.TargetTableId)
            throw new ArgumentException("Bàn đích phải khác bàn nguồn đang ngồi.");

        await using var lockHandle = await _tableLock.AcquireManyAsync(new[] { sourceId, dto.TargetTableId }, ct);

        var sourceTable = await _context.Tables.FirstOrDefaultAsync(t => t.Id == sourceId, ct);
        var targetTable = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TargetTableId, ct);

        if (sourceTable == null || targetTable == null)
            throw new KeyNotFoundException("Bàn nguồn hoặc bàn đích không tồn tại.");

        if (sourceTable.Status != TableStatus.Occupied)
            throw new InvalidOperationException($"Bàn nguồn {sourceTable.TableNumber} hiện không có khách đang dùng bữa.");

        if (!targetTable.IsActive)
            throw new InvalidOperationException($"Bàn đích {targetTable.TableNumber} hiện đang ngưng hoạt động.");

        if (targetTable.Status != TableStatus.Available)
            throw new ConflictException($"Bàn đích {targetTable.TableNumber} vừa có khách khác ngồi hoặc đang bận ({targetTable.Status}).");

        var activeOrder = await _context.Orders
            .Include(o => o.Reservation)
            .FirstOrDefaultAsync(o => o.TableId == sourceId && o.Status == OrderStatus.Processing, ct);

        if (activeOrder != null)
        {
            activeOrder.TableId = targetTable.Id;
            if (activeOrder.Reservation != null)
            {
                if (targetTable.Capacity < activeOrder.Reservation.PartySize)
                    throw new InvalidOperationException($"Bàn đích {targetTable.TableNumber} (sức chứa {targetTable.Capacity}) nhỏ hơn số khách ({activeOrder.Reservation.PartySize}).");

                activeOrder.Reservation.TableId = targetTable.Id;
            }
        }
        else
        {
            // Also move today's checked-in reservation if guest checked in but hasn't submitted the first order yet
            var checkedInReservation = await _context.Reservations
                .Where(r => r.TableId == sourceId && r.Status == ReservationStatus.Completed)
                .OrderByDescending(r => r.ReservationTime)
                .FirstOrDefaultAsync(ct);

            if (checkedInReservation != null)
            {
                var hasClosedOrder = await _context.Orders
                    .AnyAsync(o => o.ReservationId == checkedInReservation.Id && o.Status == OrderStatus.Completed, ct);

                if (!hasClosedOrder)
                {
                    if (targetTable.Capacity < checkedInReservation.PartySize)
                        throw new InvalidOperationException($"Bàn đích {targetTable.TableNumber} (sức chứa {targetTable.Capacity}) nhỏ hơn số khách ({checkedInReservation.PartySize}).");

                    checkedInReservation.TableId = targetTable.Id;
                }
            }
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
        if (dto.TableIds == null || dto.TableIds.Count < 2)
            throw new ArgumentException("Cần chọn ít nhất 2 bàn để gộp bàn.");

        await using var lockHandle = await _tableLock.AcquireManyAsync(dto.TableIds, ct);

        var tables = await _context.Tables.Where(t => dto.TableIds.Contains(t.Id)).ToListAsync(ct);
        if (tables.Count != dto.TableIds.Distinct().Count())
            throw new KeyNotFoundException("Một hoặc nhiều bàn trong danh sách gộp không tồn tại.");

        var primaryId = dto.PrimaryTableId != Guid.Empty && dto.TableIds.Contains(dto.PrimaryTableId)
            ? dto.PrimaryTableId
            : dto.TableIds[0];

        foreach (var t in tables)
        {
            if (!t.IsActive)
                throw new InvalidOperationException($"Bàn {t.TableNumber} đang ngưng hoạt động.");
            if (t.Id != primaryId && t.Status == TableStatus.Cleaning)
                throw new InvalidOperationException($"Bàn {t.TableNumber} đang dọn dẹp, chưa thể gộp bàn.");

            t.Status = TableStatus.Occupied;
        }

        // Consolidate any secondary processing order items onto the primary table's order if needed
        var activeOrders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => dto.TableIds.Contains(o.TableId) && o.Status == OrderStatus.Processing)
            .ToListAsync(ct);

        if (activeOrders.Count > 1)
        {
            var primaryOrder = activeOrders.FirstOrDefault(o => o.TableId == primaryId) ?? activeOrders[0];
            primaryOrder.TableId = primaryId;

            foreach (var secondary in activeOrders.Where(o => o.Id != primaryOrder.Id))
            {
                foreach (var item in secondary.OrderItems.ToList())
                {
                    item.OrderId = primaryOrder.Id;
                }
                secondary.Status = OrderStatus.Cancelled;
                secondary.ClosedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(ct);

        foreach (var t in tables)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(t.Id, t.TableNumber, t.Status, ct);
        }

        return true;
    }

    public async Task<List<TableDto>> GetFloorPlanAsync(CancellationToken ct = default)
    {
        var tables = await _context.Tables
            .AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.Zone)
            .ThenBy(t => t.TableNumber)
            .ToListAsync(ct);

        var activeOrdersByTable = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Processing)
            .Select(o => new { o.TableId, o.Id })
            .ToListAsync(ct);

        var orderLookup = activeOrdersByTable
            .GroupBy(x => x.TableId)
            .ToDictionary(g => g.Key, g => (Guid?)g.First().Id);

        return tables.Select(t => new TableDto(
            t.Id,
            t.TableNumber,
            t.Capacity,
            t.Zone,
            t.Status,
            t.PosX,
            t.PosY,
            orderLookup.GetValueOrDefault(t.Id),
            t.IsActive
        )).ToList();
    }

    public async Task<TableDto> GetTableByIdAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        var activeOrderId = await _context.Orders
            .AsNoTracking()
            .Where(o => o.TableId == id && o.Status == OrderStatus.Processing)
            .Select(o => (Guid?)o.Id)
            .FirstOrDefaultAsync(ct);

        return new TableDto(t.Id, t.TableNumber, t.Capacity, t.Zone, t.Status, t.PosX, t.PosY, activeOrderId, t.IsActive);
    }

    public async Task<bool> UpdateTableStatusAsync(Guid id, UpdateTableStatusDto dto, CancellationToken ct = default)
    {
        await using var lockHandle = await _tableLock.AcquireAsync(id, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (dto.Status == TableStatus.Available && table.Status == TableStatus.Occupied)
        {
            var hasUnsettledOrder = await _context.Orders
                .AnyAsync(o => o.TableId == id && o.Status == OrderStatus.Processing, ct);
            if (hasUnsettledOrder)
                throw new InvalidOperationException($"Bàn {table.TableNumber} vẫn còn đơn hàng đang phục vụ chưa thanh toán.");
        }

        table.Status = dto.Status;
        await _context.SaveChangesAsync(ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        return true;
    }
}
