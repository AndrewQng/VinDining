using API.Models.Common;

namespace API.Services;

public class TableService : ITableService
{
    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;
    private readonly IServiceCallStore? _serviceCallStore;
    private readonly IKitchenNotifier? _kitchenNotifier;
    private readonly ICurrentUserService? _currentUserService;

    public TableService(
        IApplicationDbContext context,
        ITableNotifier tableNotifier,
        ITableConcurrencyLock? tableLock = null,
        IServiceCallStore? serviceCallStore = null,
        IKitchenNotifier? kitchenNotifier = null,
        ICurrentUserService? currentUserService = null)
    {
        _context = context;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? DefaultTableLock;
        _serviceCallStore = serviceCallStore;
        _kitchenNotifier = kitchenNotifier;
        _currentUserService = currentUserService;
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
        var lookupCode = !string.IsNullOrWhiteSpace(dto.BookingCode)
            ? dto.BookingCode.Trim()
            : dto.ReservationCode?.Trim();

        if (!string.IsNullOrWhiteSpace(lookupCode))
        {
            reservation = await _context.Reservations
                .Include(r => r.Table)
                .Include(r => r.Guest)
                .FirstOrDefaultAsync(r => r.BookingCode.ToLower() == lookupCode.ToLower(), ct);

            if (reservation == null)
            {
                var normalizedPhone = ReservationService.NormalizePhoneNumber(lookupCode);
                if (normalizedPhone.Length >= 6)
                {
                    var confirmedCandidates = await _context.Reservations
                        .Include(r => r.Table)
                        .Include(r => r.Guest)
                        .Where(r => r.Status == ReservationStatus.Confirmed)
                        .OrderBy(r => r.ReservationTime)
                        .ToListAsync(ct);

                    var phoneMatches = confirmedCandidates
                        .Where(r => ReservationService.NormalizePhoneNumber(r.Guest?.PhoneNumber) == normalizedPhone)
                        .ToList();

                    reservation = phoneMatches.FirstOrDefault(r => r.TableId == id) ?? phoneMatches.FirstOrDefault();
                }
            }
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

        var now = DateTime.UtcNow;
        var upcomingWindow = now.AddMinutes(90);
        var pendingLockCutoff = now.AddMinutes(-17);

        Table? previousTableToNotify = null;
        if (reservation.TableId != table.Id)
        {
            if (table.Status != TableStatus.Available)
                throw new ConflictException($"Bàn {table.TableNumber} đang được giữ cho đơn khác, không thể xếp khách sang bàn này.");

            var targetHasUpcomingConflict = await _context.Reservations
                .AnyAsync(r => r.TableId == table.Id &&
                               r.Id != reservation.Id &&
                               (r.Status == ReservationStatus.Confirmed ||
                                (r.Status == ReservationStatus.Pending && r.CreatedAt >= pendingLockCutoff)) &&
                               r.ReservationTime >= now.AddMinutes(-15) &&
                               r.ReservationTime <= upcomingWindow, ct);

            if (targetHasUpcomingConflict)
                throw new ConflictException($"Bàn {table.TableNumber} có lịch đặt trước đã xác nhận trong vòng 90 phút tới, không thể xếp khách sang bàn này.");

            if (reservation.Table != null)
            {
                var oldTable = reservation.Table;
                var oldStatusBefore = oldTable.Status;

                var oldHasActiveOrder = await _context.Orders
                    .AnyAsync(o => o.TableId == oldTable.Id && o.Status == OrderStatus.Processing, ct);
                var oldHasOtherConfirmed = await _context.Reservations
                    .AnyAsync(r => r.TableId == oldTable.Id &&
                                   r.Id != reservation.Id &&
                                   r.Status == ReservationStatus.Confirmed, ct);
                var oldHasActivePending = await _context.Reservations
                    .AnyAsync(r => r.TableId == oldTable.Id &&
                                   r.Id != reservation.Id &&
                                   r.Status == ReservationStatus.Pending &&
                                   r.CreatedAt >= pendingLockCutoff, ct);

                if (oldHasActiveOrder)
                {
                    oldTable.Status = TableStatus.Occupied;
                }
                else if (oldHasOtherConfirmed)
                {
                    oldTable.Status = TableStatus.Reserved;
                }
                else if (oldHasActivePending)
                {
                    oldTable.Status = TableStatus.LockedForPayment;
                }
                else if (oldTable.Status == TableStatus.Reserved || oldTable.Status == TableStatus.LockedForPayment)
                {
                    oldTable.Status = TableStatus.Available;
                }

                if (oldTable.Status != oldStatusBefore)
                {
                    previousTableToNotify = oldTable;
                }
            }

            reservation.TableId = table.Id;
        }
        else if (table.Status == TableStatus.LockedForPayment)
        {
            throw new ConflictException($"Bàn {table.TableNumber} đang khóa tạm thời chờ thanh toán cọc của phiên khác.");
        }

        reservation.Status = ReservationStatus.Completed;
        table.Status = TableStatus.Occupied;

        var autoOrder = await TryCreatePreOrderedSetMenuOrderAsync(table, reservation, now, ct);

        await _context.SaveChangesAsync(ct);

        if (previousTableToNotify != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(previousTableToNotify.Id, previousTableToNotify.TableNumber, previousTableToNotify.Status, ct);
        }
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);

        if (autoOrder != null && _kitchenNotifier != null)
        {
            await _kitchenNotifier.NotifyNewOrderAsync(autoOrder.Id, table.TableNumber, ct);
        }

        return true;
    }

    private async Task<Order?> TryCreatePreOrderedSetMenuOrderAsync(
        Table table,
        Reservation reservation,
        DateTime now,
        CancellationToken ct)
    {
        var (tastingMenuId, _) = ReservationService.ParsePreOrderedSetMenu(reservation.Note);
        if (!tastingMenuId.HasValue || tastingMenuId.Value == Guid.Empty)
            return null;

        var hasActiveOrder = await _context.Orders
            .AnyAsync(o => o.TableId == table.Id && o.Status == OrderStatus.Processing, ct);
        if (hasActiveOrder)
            return null;

        var tastingMenu = await _context.TastingMenus
            .Include(tm => tm.TastingMenuItems)
                .ThenInclude(tmi => tmi.MenuItem)
            .FirstOrDefaultAsync(tm => tm.Id == tastingMenuId.Value, ct);

        if (tastingMenu == null || !tastingMenu.IsActive || tastingMenu.TastingMenuItems.Count == 0)
            return null;

        var allItemsAvailable = tastingMenu.TastingMenuItems.All(tmi =>
            tmi.MenuItem != null &&
            string.Equals(tmi.MenuItem.Status, "Available", StringComparison.OrdinalIgnoreCase));

        if (!allItemsAvailable)
            return null;

        var staffId = await ResolveCheckInStaffIdAsync(ct);
        var quantity = Math.Max(1, reservation.PartySize);
        var cleanGuestNote = ExtractCleanGuestNote(reservation.Note);

        var foodCourses = tastingMenu.TastingMenuItems
            .Where(tmi => tmi.CourseType != CourseType.Beverage)
            .Select(tmi => tmi.CourseType)
            .ToList();
        var firstCourse = foodCourses.Count != 0 ? foodCourses.Min() : CourseType.Appetizer;

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TableId = table.Id,
            ReservationId = reservation.Id,
            CreateById = staffId,
            Status = OrderStatus.Processing,
            IsPriority = false,
            OpenedAt = now
        };

        order.OrderItems.Add(new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            TastingMenuId = tastingMenu.Id,
            MenuItemId = null,
            Quantity = quantity,
            UnitPrice = tastingMenu.Price,
            Status = OrderItemStatus.Hold,
            FiredAt = null,
            Note = cleanGuestNote
        });

        foreach (var courseDef in tastingMenu.TastingMenuItems.OrderBy(c => c.CourseOrder))
        {
            var isImmediate = courseDef.CourseType == CourseType.Beverage || courseDef.CourseType == firstCourse;
            order.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                TastingMenuId = tastingMenu.Id,
                MenuItemId = courseDef.MenuItemId,
                Quantity = quantity,
                UnitPrice = 0m,
                Status = isImmediate ? OrderItemStatus.Preparing : OrderItemStatus.Hold,
                FiredAt = isImmediate ? now : null,
                IsRush = false,
                Note = cleanGuestNote
            });
        }

        await _context.Orders.AddAsync(order, ct);
        return order;
    }

    private async Task<Guid> ResolveCheckInStaffIdAsync(CancellationToken ct)
    {
        var candidate = _currentUserService?.UserId;
        if (candidate.HasValue && candidate.Value != Guid.Empty)
        {
            if (await _context.Staffs.AnyAsync(s => s.Id == candidate.Value, ct))
                return candidate.Value;
        }

        var activeStaff = await _context.Staffs.FirstOrDefaultAsync(s => s.IsActive, ct);
        if (activeStaff != null)
            return activeStaff.Id;

        var fallback = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = "Nhân viên Phục vụ",
            Username = $"staff_{Guid.NewGuid():N}"[..16],
            Email = $"staff_{Guid.NewGuid():N}@vindining.vn",
            PhoneNumber = "0900000000",
            PasswordHash = "system",
            Role = StaffRole.Waitstaff,
            IsActive = true
        };
        await _context.Staffs.AddAsync(fallback, ct);
        return fallback.Id;
    }

    private static string? ExtractCleanGuestNote(string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
            return null;

        var trimmed = note.Trim();
        const string prefix = "[Set Menu đặt trước: ";
        var startIdx = trimmed.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
        if (startIdx >= 0)
        {
            var closeIdx = trimmed.IndexOf(")]", startIdx + prefix.Length, StringComparison.Ordinal);
            if (closeIdx >= 0)
            {
                var before = trimmed[..startIdx].Trim();
                var after = trimmed[(closeIdx + 2)..].Trim();
                var combined = string.IsNullOrEmpty(before)
                    ? after
                    : string.IsNullOrEmpty(after)
                        ? before
                        : $"{before} {after}";
                return string.IsNullOrWhiteSpace(combined) ? null : combined;
            }
        }

        return trimmed;
    }

    public async Task<Guid> CheckInWalkInAsync(Guid id, WalkInDto dto, CancellationToken ct = default)
    {
        var partySize = dto.GuestCount is > 0 ? dto.GuestCount.Value : dto.PartySize;
        if (partySize <= 0)
            throw new ArgumentException("Số lượng thực khách phải lớn hơn 0.");

        await using var lockHandle = await _tableLock.AcquireAsync(id, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng hoạt động.");

        if (table.Status != TableStatus.Available)
            throw new ConflictException($"Bàn {table.TableNumber} không ở trạng thái trống ({table.Status}).");

        if (table.Capacity < partySize)
            throw new InvalidOperationException($"Bàn {table.TableNumber} (sức chứa {table.Capacity}) nhỏ hơn số lượng thực khách ({partySize}).");

        var now = DateTime.UtcNow;
        var upcomingWindow = now.AddMinutes(90);
        var pendingLockCutoff = now.AddMinutes(-17);
        var hasUpcomingReservation = await _context.Reservations
            .AnyAsync(r => r.TableId == id &&
                           (r.Status == ReservationStatus.Confirmed ||
                            (r.Status == ReservationStatus.Pending && r.CreatedAt >= pendingLockCutoff)) &&
                           r.ReservationTime >= now.AddMinutes(-15) &&
                           r.ReservationTime <= upcomingWindow, ct);

        if (hasUpcomingReservation)
            throw new ConflictException($"Bàn {table.TableNumber} có lịch đặt trước đã xác nhận trong vòng 90 phút tới, vui lòng xếp bàn khác.");

        var phone = dto.PhoneNumber?.Trim() ?? string.Empty;
        var guestName = string.IsNullOrWhiteSpace(dto.GuestName) ? "Thực khách" : dto.GuestName.Trim();

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

        var now = DateTime.UtcNow;
        var upcomingWindow = now.AddMinutes(90);
        var pendingLockCutoff = now.AddMinutes(-17);
        var hasUpcomingReservation = await _context.Reservations
            .AnyAsync(r => r.TableId == targetTable.Id &&
                           (r.Status == ReservationStatus.Confirmed ||
                            (r.Status == ReservationStatus.Pending && r.CreatedAt >= pendingLockCutoff)) &&
                           r.ReservationTime >= now.AddMinutes(-15) &&
                           r.ReservationTime <= upcomingWindow, ct);

        if (hasUpcomingReservation)
            throw new ConflictException($"Bàn đích {targetTable.TableNumber} có lịch đặt trước đã xác nhận trong vòng 90 phút tới, vui lòng chọn bàn khác.");

        var activeOrder = await _context.Orders
            .Include(o => o.Reservation)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.TableId == sourceId && o.Status == OrderStatus.Processing, ct);

        if (activeOrder != null)
        {
            if (activeOrder.Reservation != null)
            {
                if (targetTable.Capacity < activeOrder.Reservation.PartySize)
                    throw new InvalidOperationException($"Bàn đích {targetTable.TableNumber} (sức chứa {targetTable.Capacity}) nhỏ hơn số khách ({activeOrder.Reservation.PartySize}).");

                activeOrder.Reservation.TableId = targetTable.Id;
            }
            else
            {
                var setMenuGuests = activeOrder.OrderItems
                    .Where(oi => oi.TastingMenuId != null && oi.MenuItemId == null && oi.Status != OrderItemStatus.Cancelled)
                    .Sum(oi => oi.Quantity);

                if (setMenuGuests > 0 && targetTable.Capacity < setMenuGuests)
                    throw new InvalidOperationException($"Bàn đích {targetTable.TableNumber} (sức chứa {targetTable.Capacity}) nhỏ hơn số suất Set Menu đang phục vụ ({setMenuGuests}).");
            }

            activeOrder.TableId = targetTable.Id;
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

        _serviceCallStore?.RelocateTable(sourceTable.Id, targetTable.Id, targetTable.TableNumber);

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
            .Include(o => o.CreateBy)
            .Include(o => o.Reservation)
            .Include(o => o.OrderItems)
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Processing)
            .ToListAsync(ct);

        var orderLookup = activeOrdersByTable
            .GroupBy(x => x.TableId)
            .ToDictionary(g => g.Key, g => g.First());

        var activeReservationsByTable = await _context.Reservations
            .AsNoTracking()
            .Where(r => !r.BookingCode.StartsWith("WALKIN-") &&
                        (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Completed))
            .OrderByDescending(r => r.ReservationTime)
            .ToListAsync(ct);

        var resLookup = activeReservationsByTable
            .GroupBy(r => r.TableId)
            .ToDictionary(g => g.Key, g => g.First());

        return tables.Select(t =>
        {
            orderLookup.TryGetValue(t.Id, out var ord);
            resLookup.TryGetValue(t.Id, out var res);
            var guestCount = ord?.Reservation?.PartySize
                ?? (t.Status == TableStatus.Occupied || t.Status == TableStatus.Reserved || t.Status == TableStatus.LockedForPayment ? res?.PartySize : null);
            var resCode = (t.Status == TableStatus.Occupied || t.Status == TableStatus.Reserved || t.Status == TableStatus.LockedForPayment)
                ? (ord?.Reservation?.BookingCode ?? res?.BookingCode)
                : null;
            var holdExp = t.Status == TableStatus.LockedForPayment && res != null
                ? (DateTime?)res.CreatedAt.AddMinutes(ReservationService.LockDurationMinutes)
                : null;

            return new TableDto(
                t.Id,
                t.TableNumber,
                t.Capacity,
                t.Zone,
                t.Status,
                t.PosX,
                t.PosY,
                ord?.Id,
                t.IsActive,
                $"VD-QR-{t.TableNumber}",
                ord?.CreateById,
                ord?.CreateBy?.FullName,
                resCode,
                guestCount,
                holdExp,
                null
            );
        }).ToList();
    }

    public async Task<TableDto> GetTableByIdAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        var ord = await _context.Orders
            .Include(o => o.CreateBy)
            .Include(o => o.Reservation)
            .AsNoTracking()
            .Where(o => o.TableId == id && o.Status == OrderStatus.Processing)
            .FirstOrDefaultAsync(ct);

        var res = await _context.Reservations
            .AsNoTracking()
            .Where(r => r.TableId == id && !r.BookingCode.StartsWith("WALKIN-") &&
                        (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Completed))
            .OrderByDescending(r => r.ReservationTime)
            .FirstOrDefaultAsync(ct);

        var guestCount = ord?.Reservation?.PartySize
            ?? (t.Status == TableStatus.Occupied || t.Status == TableStatus.Reserved || t.Status == TableStatus.LockedForPayment ? res?.PartySize : null);
        var resCode = (t.Status == TableStatus.Occupied || t.Status == TableStatus.Reserved || t.Status == TableStatus.LockedForPayment)
            ? (ord?.Reservation?.BookingCode ?? res?.BookingCode)
            : null;
        var holdExp = t.Status == TableStatus.LockedForPayment && res != null
            ? (DateTime?)res.CreatedAt.AddMinutes(ReservationService.LockDurationMinutes)
            : null;

        return new TableDto(
            t.Id,
            t.TableNumber,
            t.Capacity,
            t.Zone,
            t.Status,
            t.PosX,
            t.PosY,
            ord?.Id,
            t.IsActive,
            $"VD-QR-{t.TableNumber}",
            ord?.CreateById,
            ord?.CreateBy?.FullName,
            resCode,
            guestCount,
            holdExp,
            null);
    }

    public async Task<bool> UpdateTableStatusAsync(Guid id, UpdateTableStatusDto dto, CancellationToken ct = default)
    {
        await using var lockHandle = await _tableLock.AcquireAsync(id, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {id}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng hoạt động.");

        if (table.Status == TableStatus.Occupied && dto.Status != TableStatus.Occupied)
        {
            var hasUnsettledOrder = await _context.Orders
                .AnyAsync(o => o.TableId == id && o.Status == OrderStatus.Processing, ct);
            if (hasUnsettledOrder)
                throw new InvalidOperationException($"Bàn {table.TableNumber} vẫn còn đơn hàng đang phục vụ chưa thanh toán.");
        }

        if (table.Status == TableStatus.Reserved &&
            dto.Status != TableStatus.Reserved &&
            dto.Status != TableStatus.Occupied)
        {
            var hasConfirmedReservation = await _context.Reservations
                .AnyAsync(r => r.TableId == id && r.Status == ReservationStatus.Confirmed, ct);
            if (hasConfirmedReservation)
                throw new InvalidOperationException($"Bàn {table.TableNumber} đang giữ chỗ cho đơn đặt bàn đã xác nhận cọc, không thể chuyển về trạng thái {dto.Status} khi chưa hủy đơn.");
        }

        if (table.Status == TableStatus.LockedForPayment && dto.Status == TableStatus.Available)
        {
            var pendingLockCutoff = DateTime.UtcNow.AddMinutes(-17);
            var hasActivePendingLock = await _context.Reservations
                .AnyAsync(r => r.TableId == id && r.Status == ReservationStatus.Pending && r.CreatedAt >= pendingLockCutoff, ct);
            if (hasActivePendingLock)
                throw new InvalidOperationException($"Bàn {table.TableNumber} đang khóa giữ chỗ chờ thanh toán cọc, chưa thể mở khóa thủ công.");
        }

        table.Status = dto.Status;
        await _context.SaveChangesAsync(ct);
        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        return true;
    }
}
