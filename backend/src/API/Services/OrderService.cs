using API.Models.Common;

namespace API.Services;

public class OrderService : IOrderService
{
    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IKitchenNotifier _kitchenNotifier;
    private readonly ITableNotifier? _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;

    public OrderService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IKitchenNotifier kitchenNotifier,
        ITableNotifier? tableNotifier = null,
        ITableConcurrencyLock? tableLock = null)
    {
        _context = context;
        _currentUserService = currentUserService;
        _kitchenNotifier = kitchenNotifier;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? DefaultTableLock;
    }

    public async Task<Guid> CreateOrderWithCoursesAsync(CreateOrderDto dto, CancellationToken ct = default)
    {
        var requestedItems = dto.Items ?? new List<OrderItemRequestDto>();
        var requestedTastingMenus = dto.TastingMenus ?? new List<OrderTastingMenuRequestDto>();

        if (requestedItems.Count == 0 && requestedTastingMenus.Count == 0)
            throw new ArgumentException("Đơn gọi món phải chứa ít nhất một món ăn hoặc Set Menu.");

        if (requestedItems.Any(i => i.Quantity <= 0) || requestedTastingMenus.Any(tm => tm.Quantity <= 0))
            throw new ArgumentException("Số lượng mỗi món ăn phải lớn hơn 0.");

        await using var lockHandle = await _tableLock.AcquireAsync(dto.TableId, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {dto.TableId}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng phục vụ.");

        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, chưa thể tạo đơn.");

        var existingActiveOrder = await _context.Orders
            .AnyAsync(o => o.TableId == table.Id && o.Status == OrderStatus.Processing, ct);

        if (existingActiveOrder)
            throw new ConflictException($"Bàn {table.TableNumber} đang có đơn phục vụ hoạt động. Vui lòng sử dụng chức năng bổ sung món.");

        var staffId = await ResolveStaffIdAsync(dto.StaffId, ct);
        var reservationId = await ResolveActiveReservationIdAsync(table.Id, dto.ReservationId, ct);

        var requestedItemIds = requestedItems
            .Where(x => x.MenuItemId != Guid.Empty)
            .Select(x => x.MenuItemId)
            .Distinct()
            .ToList();

        var menuItems = await _context.MenuItems
            .Where(m => requestedItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        foreach (var reqItem in requestedItems)
        {
            if (!menuItems.TryGetValue(reqItem.MenuItemId, out var menuItem))
                throw new KeyNotFoundException($"Không tìm thấy món ăn {reqItem.MenuItemId}.");

            if (!string.Equals(menuItem.Status, "Available", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Món '{menuItem.Name}' hiện đang tạm hết hàng, vui lòng chọn món khác.");
        }

        var tastingMenuIds = requestedTastingMenus
            .Select(tm => tm.TastingMenuId)
            .Concat(requestedItems.Where(i => i.TastingMenuId.HasValue && i.MenuItemId == Guid.Empty).Select(i => i.TastingMenuId!.Value))
            .Distinct()
            .ToList();

        var tastingMenus = tastingMenuIds.Count > 0
            ? await _context.TastingMenus
                .Include(tm => tm.TastingMenuItems)
                    .ThenInclude(tmi => tmi.MenuItem)
                .Where(tm => tastingMenuIds.Contains(tm.Id))
                .ToDictionaryAsync(tm => tm.Id, ct)
            : new Dictionary<Guid, TastingMenu>();

        foreach (var tmReq in requestedTastingMenus)
        {
            if (!tastingMenus.TryGetValue(tmReq.TastingMenuId, out var tm))
                throw new KeyNotFoundException($"Không tìm thấy thực đơn Set Menu {tmReq.TastingMenuId}.");
            if (!tm.IsActive)
                throw new InvalidOperationException($"Thực đơn Set Menu '{tm.Name}' hiện không khả dụng.");
        }

        var now = DateTime.UtcNow;
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TableId = table.Id,
            ReservationId = reservationId,
            CreateById = staffId,
            Status = OrderStatus.Processing,
            IsPriority = dto.IsPriority,
            OpenedAt = now
        };

        var allFoodCourses = menuItems.Values
            .Where(m => m.CourseType != CourseType.Beverage)
            .Select(m => m.CourseType)
            .Concat(tastingMenus.Values.SelectMany(tm => tm.TastingMenuItems).Where(tmi => tmi.CourseType != CourseType.Beverage).Select(tmi => tmi.CourseType))
            .ToList();

        var firstCourse = allFoodCourses.Count != 0 ? allFoodCourses.Min() : CourseType.Appetizer;

        foreach (var itemDto in requestedItems)
        {
            var menuItem = menuItems[itemDto.MenuItemId];
            var isImmediate = menuItem.CourseType == CourseType.Beverage || menuItem.CourseType == firstCourse;

            order.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                Quantity = itemDto.Quantity,
                UnitPrice = menuItem.Price,
                Status = isImmediate ? OrderItemStatus.Preparing : OrderItemStatus.Hold,
                FiredAt = isImmediate ? now : null,
                IsRush = dto.IsPriority && isImmediate,
                Note = itemDto.Note?.Trim()
            });
        }

        foreach (var tmDto in requestedTastingMenus)
        {
            var tm = tastingMenus[tmDto.TastingMenuId];

            // Billing header item carrying package price
            order.OrderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                TastingMenuId = tm.Id,
                MenuItemId = null,
                Quantity = tmDto.Quantity,
                UnitPrice = tm.Price,
                Status = OrderItemStatus.Hold,
                FiredAt = null,
                Note = tmDto.Note?.Trim()
            });

            foreach (var courseDef in tm.TastingMenuItems.OrderBy(c => c.CourseOrder))
            {
                var isImmediate = courseDef.CourseType == CourseType.Beverage || courseDef.CourseType == firstCourse;
                order.OrderItems.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    TastingMenuId = tm.Id,
                    MenuItemId = courseDef.MenuItemId,
                    Quantity = tmDto.Quantity,
                    UnitPrice = 0m,
                    Status = isImmediate ? OrderItemStatus.Preparing : OrderItemStatus.Hold,
                    FiredAt = isImmediate ? now : null,
                    IsRush = dto.IsPriority && isImmediate,
                    Note = tmDto.Note?.Trim()
                });
            }
        }

        var statusChanged = table.Status != TableStatus.Occupied;
        table.Status = TableStatus.Occupied;

        await _context.Orders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);

        if (statusChanged && _tableNotifier != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        }

        await _kitchenNotifier.NotifyNewOrderAsync(order.Id, table.TableNumber, ct);

        return order.Id;
    }

    public async Task<int> FireNextCourseAsync(Guid id, FireCourseDto dto, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Chỉ có thể bắn lệnh chế biến cho đơn hàng đang phục vụ.");

        var itemsToFire = order.OrderItems
            .Where(oi => oi.MenuItemId != null &&
                         oi.Status == OrderItemStatus.Hold &&
                         oi.MenuItem?.CourseType == dto.CourseType)
            .ToList();

        if (itemsToFire.Count == 0)
            return 0;

        var now = DateTime.UtcNow;
        if (dto.IsPriority)
        {
            order.IsPriority = true;
        }

        foreach (var item in itemsToFire)
        {
            item.Status = OrderItemStatus.Preparing;
            item.FiredAt = now;
            if (dto.IsPriority)
            {
                item.IsRush = true;
            }
        }

        await _context.SaveChangesAsync(ct);
        await _kitchenNotifier.NotifyCourseFiredAsync(order.Id, order.Table?.TableNumber ?? "N/A", dto.CourseType, ct);
        return itemsToFire.Count;
    }

    public async Task<int> AddOrderItemsAsync(Guid id, AddItemsDto itemsDto, CancellationToken ct = default)
    {
        if (itemsDto.Items == null || itemsDto.Items.Count == 0)
            throw new ArgumentException("Danh sách món bổ sung không được để trống.");

        if (itemsDto.Items.Any(i => i.Quantity <= 0))
            throw new ArgumentException("Số lượng món bổ sung phải lớn hơn 0.");

        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Đơn hàng đã hoàn tất hoặc đã hủy, không thể bổ sung món.");

        var requestedItemIds = itemsDto.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _context.MenuItems
            .Where(m => requestedItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        foreach (var req in itemsDto.Items)
        {
            if (!menuItems.TryGetValue(req.MenuItemId, out var menuItem))
                throw new KeyNotFoundException($"Không tìm thấy món ăn {req.MenuItemId}.");

            if (!string.Equals(menuItem.Status, "Available", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Món '{menuItem.Name}' hiện đang tạm hết hàng, không thể bổ sung.");
        }

        // Determine highest active/served food course in the order so later unfired courses remain on Hold until fired
        var highestFiredFoodCourse = order.OrderItems
            .Where(oi => oi.MenuItem != null &&
                         oi.MenuItem.CourseType != CourseType.Beverage &&
                         (oi.Status == OrderItemStatus.Preparing || oi.Status == OrderItemStatus.Served))
            .Select(oi => (CourseType?)oi.MenuItem!.CourseType)
            .Max();

        var now = DateTime.UtcNow;
        var newEntities = new List<OrderItem>();

        foreach (var itemDto in itemsDto.Items)
        {
            var menuItem = menuItems[itemDto.MenuItemId];
            bool shouldFireNow = itemsDto.FireImmediately ?? (
                menuItem.CourseType == CourseType.Beverage ||
                highestFiredFoodCourse == null ||
                menuItem.CourseType <= highestFiredFoodCourse.Value);

            var newItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                Quantity = itemDto.Quantity,
                UnitPrice = menuItem.Price,
                Status = shouldFireNow ? OrderItemStatus.Preparing : OrderItemStatus.Hold,
                FiredAt = shouldFireNow ? now : null,
                Note = itemDto.Note?.Trim()
            };

            order.OrderItems.Add(newItem);
            newEntities.Add(newItem);
        }

        await _context.OrderItems.AddRangeAsync(newEntities, ct);
        await _context.SaveChangesAsync(ct);

        if (newEntities.Any(i => i.Status == OrderItemStatus.Preparing))
        {
            await _kitchenNotifier.NotifyNewOrderAsync(order.Id, order.Table?.TableNumber ?? "N/A", ct);
        }

        return newEntities.Count;
    }

    public async Task<bool> ConfirmServedAsync(Guid id, Guid itemId, CancellationToken ct = default)
    {
        EnsureExpediterOrManagerPermission();

        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        var orderItem = order.OrderItems.FirstOrDefault(oi => oi.Id == itemId);
        if (orderItem == null)
            throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        if (orderItem.Status == OrderItemStatus.Cancelled)
            throw new InvalidOperationException("Món ăn đã bị hủy, không thể xác nhận ra món.");

        if (orderItem.Status == OrderItemStatus.Hold && orderItem.MenuItemId != null)
            throw new InvalidOperationException("Món ăn vẫn đang ở trạng thái chờ (Hold), chưa được bắn lệnh chế biến.");

        if (orderItem.Status == OrderItemStatus.Served)
            return true;

        var now = DateTime.UtcNow;
        var servedById = await ResolveExistingStaffIdOrNullAsync(_currentUserService.UserId, ct);

        orderItem.Status = OrderItemStatus.Served;
        orderItem.ServedAt = now;
        orderItem.ServedById = servedById;
        orderItem.IsRush = false;

        // If this item belongs to a TastingMenu, mark the TastingMenu billing header as Served once all its child courses are Served
        if (orderItem.TastingMenuId.HasValue && orderItem.MenuItemId.HasValue)
        {
            var siblingCourses = order.OrderItems
                .Where(oi => oi.TastingMenuId == orderItem.TastingMenuId &&
                             oi.MenuItemId != null &&
                             oi.Status != OrderItemStatus.Cancelled)
                .ToList();

            if (siblingCourses.Count > 0 && siblingCourses.All(c => c.Status == OrderItemStatus.Served))
            {
                foreach (var billingHeader in order.OrderItems.Where(oi => oi.TastingMenuId == orderItem.TastingMenuId && oi.MenuItemId == null))
                {
                    billingHeader.Status = OrderItemStatus.Served;
                    billingHeader.ServedAt = now;
                    billingHeader.ServedById = servedById;
                }
            }
        }

        await _context.SaveChangesAsync(ct);

        await _kitchenNotifier.NotifyItemServedAsync(
            id,
            order.Table?.TableNumber ?? "N/A",
            itemId,
            orderItem.MenuItem?.Name ?? "Món Set Menu",
            servedById,
            ct);

        return true;
    }

    public async Task<bool> RemakeOrderItemAsync(Guid id, Guid itemId, RemakeItemDto? dto = null, CancellationToken ct = default)
    {
        EnsureExpediterOrManagerPermission();

        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Đơn hàng đã đóng, không thể gửi yêu cầu chế biến lại.");

        var orderItem = order.OrderItems.FirstOrDefault(oi => oi.Id == itemId);
        if (orderItem == null)
            throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        if (orderItem.Status == OrderItemStatus.Cancelled)
            throw new InvalidOperationException("Món đã bị hủy, không thể yêu cầu chế biến lại.");

        var reason = string.IsNullOrWhiteSpace(dto?.Reason)
            ? "Yêu cầu làm lại từ quầy Pass"
            : dto!.Reason!.Trim();

        orderItem.Status = OrderItemStatus.Preparing;
        orderItem.IsRush = true;
        orderItem.FiredAt = DateTime.UtcNow;
        orderItem.ServedAt = null;
        orderItem.ServedById = null;
        orderItem.Note = string.IsNullOrWhiteSpace(orderItem.Note)
            ? $"[LÀM LẠI: {reason}]"
            : $"{orderItem.Note} | [LÀM LẠI: {reason}]";

        // Revert parent TastingMenu billing header if a course is being remade
        if (orderItem.TastingMenuId.HasValue && orderItem.MenuItemId.HasValue)
        {
            foreach (var header in order.OrderItems.Where(oi => oi.TastingMenuId == orderItem.TastingMenuId && oi.MenuItemId == null && oi.Status == OrderItemStatus.Served))
            {
                header.Status = OrderItemStatus.Hold;
                header.ServedAt = null;
            }
        }

        await _context.SaveChangesAsync(ct);

        await _kitchenNotifier.NotifyItemRemakeAsync(
            order.Id,
            order.Table?.TableNumber ?? "N/A",
            orderItem.Id,
            orderItem.MenuItem?.Name ?? "Món ăn",
            reason,
            ct);

        return true;
    }

    public async Task<OrderDetailDto?> GetActiveOrderByTableAsync(Guid tableId, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TableId == tableId && o.Status == OrderStatus.Processing, ct);

        if (order == null) return null;

        return MapOrderDetail(order);
    }

    public async Task<OrderDetailDto> GetOrderDetailsAsync(Guid id, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        return MapOrderDetail(order);
    }

    public async Task<bool> CancelOrderItemAsync(Guid id, Guid itemId, string? reason = null, CancellationToken ct = default)
    {
        var orderItem = await _context.OrderItems
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .Include(oi => oi.MenuItem)
            .FirstOrDefaultAsync(oi => oi.OrderId == id && oi.Id == itemId, ct);

        if (orderItem == null)
            throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        if (orderItem.Status == OrderItemStatus.Served)
            throw new InvalidOperationException("Món đã phục vụ lên bàn khách, không thể hủy.");

        if (orderItem.Status == OrderItemStatus.Cancelled)
            return true;

        orderItem.Status = OrderItemStatus.Cancelled;
        if (!string.IsNullOrWhiteSpace(reason))
        {
            orderItem.Note = string.IsNullOrWhiteSpace(orderItem.Note)
                ? $"[HỦY: {reason.Trim()}]"
                : $"{orderItem.Note} | [HỦY: {reason.Trim()}]";
        }

        await _context.SaveChangesAsync(ct);

        await _kitchenNotifier.NotifyItemCancelledAsync(
            id,
            orderItem.Order?.Table?.TableNumber ?? "N/A",
            orderItem.Id,
            orderItem.MenuItem?.Name ?? "Món ăn",
            reason,
            ct);

        return true;
    }

    public async Task<List<OrderItemDetailDto>> GetKitchenPendingOrdersAsync(CancellationToken ct = default)
    {
        var pendingItems = await _context.OrderItems
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .Include(oi => oi.MenuItem)
            .AsNoTracking()
            .Where(oi => oi.Status == OrderItemStatus.Preparing &&
                         oi.MenuItemId != null &&
                         oi.Order.Status == OrderStatus.Processing)
            .OrderByDescending(oi => oi.IsRush)
            .ThenByDescending(oi => oi.Order.IsPriority)
            .ThenBy(oi => oi.FiredAt)
            .ToListAsync(ct);

        return pendingItems.Select(oi => new OrderItemDetailDto(
            oi.Id,
            oi.MenuItemId ?? Guid.Empty,
            oi.MenuItem?.Name ?? "N/A",
            oi.UnitPrice,
            oi.Quantity,
            oi.Status,
            oi.MenuItem?.CourseType ?? CourseType.MainCourse,
            oi.FiredAt,
            oi.Note,
            oi.OrderId,
            oi.Order?.Table?.TableNumber ?? "N/A",
            oi.IsRush,
            oi.MenuItem?.PrepTimeMinutes ?? 15,
            oi.ServedAt,
            oi.TastingMenuId
        )).ToList();
    }

    private void EnsureExpediterOrManagerPermission()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.Role))
            return;

        var role = _currentUserService.Role;
        if (!string.Equals(role, nameof(StaffRole.Expediter), StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(role, nameof(StaffRole.Admin), StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenAccessException("Chỉ Nhân viên Điều phối (Expediter) hoặc Quản lý mới có quyền xác nhận ra món hoặc yêu cầu làm lại tại quầy Pass.");
        }
    }

    private async Task<Guid> ResolveStaffIdAsync(Guid? explicitStaffId, CancellationToken ct)
    {
        var candidate = explicitStaffId ?? _currentUserService.UserId;
        if (candidate.HasValue && candidate.Value != Guid.Empty)
        {
            var exists = await _context.Staffs.AnyAsync(s => s.Id == candidate.Value, ct);
            if (exists) return candidate.Value;
        }

        var defaultStaff = await _context.Staffs.FirstOrDefaultAsync(s => s.IsActive, ct);
        if (defaultStaff != null) return defaultStaff.Id;

        var fallback = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = "System Waitstaff",
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

    private async Task<Guid?> ResolveExistingStaffIdOrNullAsync(Guid? staffId, CancellationToken ct)
    {
        if (!staffId.HasValue || staffId.Value == Guid.Empty)
            return null;

        var exists = await _context.Staffs.AnyAsync(s => s.Id == staffId.Value, ct);
        return exists ? staffId.Value : null;
    }

    private async Task<Guid?> ResolveActiveReservationIdAsync(Guid tableId, Guid? requestedReservationId, CancellationToken ct)
    {
        if (requestedReservationId.HasValue && requestedReservationId.Value != Guid.Empty)
        {
            var exists = await _context.Reservations.AnyAsync(r => r.Id == requestedReservationId.Value, ct);
            if (exists) return requestedReservationId.Value;
        }

        // Automatically bind to today's checked-in or confirmed reservation on this table that hasn't been settled yet
        var settledReservationIds = await _context.Orders
            .Where(o => o.TableId == tableId && o.ReservationId != null && o.Status == OrderStatus.Completed)
            .Select(o => o.ReservationId!.Value)
            .ToListAsync(ct);

        var candidate = await _context.Reservations
            .Where(r => r.TableId == tableId &&
                        (r.Status == ReservationStatus.Completed || r.Status == ReservationStatus.Confirmed) &&
                        !settledReservationIds.Contains(r.Id))
            .OrderByDescending(r => r.ReservationTime)
            .Select(r => (Guid?)r.Id)
            .FirstOrDefaultAsync(ct);

        return candidate;
    }

    private static OrderDetailDto MapOrderDetail(Order order)
    {
        var tableNumber = order.Table?.TableNumber ?? "N/A";
        return new OrderDetailDto(
            order.Id,
            order.TableId,
            tableNumber,
            order.Status,
            order.OpenedAt,
            order.ClosedAt,
            order.OrderItems.Select(oi => new OrderItemDetailDto(
                oi.Id,
                oi.MenuItemId ?? Guid.Empty,
                oi.MenuItem?.Name ?? oi.TastingMenu?.Name ?? "Set Menu",
                oi.UnitPrice,
                oi.Quantity,
                oi.Status,
                oi.MenuItem?.CourseType ?? CourseType.Appetizer,
                oi.FiredAt,
                oi.Note,
                order.Id,
                tableNumber,
                oi.IsRush,
                oi.MenuItem?.PrepTimeMinutes ?? 15,
                oi.ServedAt,
                oi.TastingMenuId
            )).ToList(),
            order.ReservationId,
            order.IsPriority
        );
    }
}
