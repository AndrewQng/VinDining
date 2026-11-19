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
        var rawItems = dto.Items ?? new List<OrderItemRequestDto>();
        var rawTastingMenus = new List<OrderTastingMenuRequestDto>(dto.TastingMenus ?? new List<OrderTastingMenuRequestDto>());
        if (dto.TastingMenuId.HasValue && dto.TastingMenuId.Value != Guid.Empty)
        {
            rawTastingMenus.Add(new OrderTastingMenuRequestDto(
                dto.TastingMenuId.Value,
                Math.Max(1, dto.GuestCount ?? 2),
                null));
        }

        if (rawItems.Count == 0 && rawTastingMenus.Count == 0)
            throw new ArgumentException("Đơn gọi món phải chứa ít nhất một món ăn hoặc Set Menu.");

        if (rawItems.Any(i => i.Quantity <= 0) || rawTastingMenus.Any(tm => tm.Quantity <= 0))
            throw new ArgumentException("Số lượng mỗi món ăn phải lớn hơn 0.");

        if (rawItems.Any(i => (!i.MenuItemId.HasValue || i.MenuItemId.Value == Guid.Empty) && !i.TastingMenuId.HasValue))
            throw new ArgumentException("Mã món ăn không hợp lệ.");

        var requestedItems = rawItems
            .Where(i => i.MenuItemId.HasValue && i.MenuItemId.Value != Guid.Empty)
            .ToList();

        var requestedTastingMenus = rawTastingMenus
            .Concat(rawItems
                .Where(i => (!i.MenuItemId.HasValue || i.MenuItemId.Value == Guid.Empty) && i.TastingMenuId.HasValue)
                .Select(i => new OrderTastingMenuRequestDto(i.TastingMenuId!.Value, i.Quantity, i.Note)))
            .GroupBy(tm => tm.TastingMenuId)
            .Select(g => new OrderTastingMenuRequestDto(
                g.Key,
                g.Sum(x => x.Quantity),
                string.Join(" | ", g.Select(x => x.Note?.Trim()).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct())))
            .ToList();

        await using var lockHandle = await _tableLock.AcquireAsync(dto.TableId, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {dto.TableId}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng phục vụ.");

        if (table.Status == TableStatus.LockedForPayment)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang khóa tạm thời chờ thanh toán tiền cọc, chưa thể tạo đơn phục vụ.");

        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, chưa thể tạo đơn.");

        var existingActiveOrder = await _context.Orders
            .AnyAsync(o => o.TableId == table.Id && o.Status == OrderStatus.Processing, ct);

        if (existingActiveOrder)
            throw new ConflictException($"Bàn {table.TableNumber} đang có đơn phục vụ hoạt động. Vui lòng sử dụng chức năng bổ sung món.");

        var staffId = await ResolveStaffIdAsync(dto.StaffId, ct);
        var boundReservation = await ResolveActiveReservationAsync(table, dto.ReservationId, ct);

        var requestedItemIds = requestedItems
            .Select(x => x.MenuItemId!.Value)
            .Distinct()
            .ToList();

        var menuItems = requestedItemIds.Count > 0
            ? await _context.MenuItems
                .Where(m => requestedItemIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id, ct)
            : new Dictionary<Guid, MenuItem>();

        foreach (var reqItem in requestedItems)
        {
            if (!menuItems.TryGetValue(reqItem.MenuItemId!.Value, out var menuItem))
                throw new KeyNotFoundException($"Không tìm thấy món ăn {reqItem.MenuItemId}.");

            if (!string.Equals(menuItem.Status, "Available", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Món '{menuItem.Name}' hiện đang tạm hết hàng, vui lòng chọn món khác.");
        }

        var tastingMenuIds = requestedTastingMenus
            .Select(tm => tm.TastingMenuId)
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
            if (tm.TastingMenuItems.Count == 0)
                throw new InvalidOperationException($"Thực đơn Set Menu '{tm.Name}' chưa có danh mục món thành phần.");

            foreach (var courseItem in tm.TastingMenuItems.OrderBy(c => c.CourseOrder))
            {
                if (courseItem.MenuItem == null || !string.Equals(courseItem.MenuItem.Status, "Available", StringComparison.OrdinalIgnoreCase))
                {
                    var dishName = courseItem.MenuItem?.Name ?? courseItem.MenuItemId.ToString();
                    throw new InvalidOperationException($"Món '{dishName}' trong Set Menu '{tm.Name}' hiện đang tạm hết nguyên liệu, vui lòng tư vấn thực đơn khác.");
                }
            }
        }

        var now = DateTime.UtcNow;
        if (boundReservation != null)
        {
            if (boundReservation.Status == ReservationStatus.Confirmed)
            {
                boundReservation.Status = ReservationStatus.Completed;
            }
            if (boundReservation.TableId != table.Id)
            {
                boundReservation.TableId = table.Id;
            }
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TableId = table.Id,
            ReservationId = boundReservation?.Id,
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
            var menuItem = menuItems[itemDto.MenuItemId!.Value];
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
                Note = string.IsNullOrWhiteSpace(itemDto.Note) ? null : itemDto.Note.Trim()
            });
        }

        foreach (var tmDto in requestedTastingMenus)
        {
            var tm = tastingMenus[tmDto.TastingMenuId];
            var cleanNote = string.IsNullOrWhiteSpace(tmDto.Note) ? null : tmDto.Note.Trim();

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
                Note = cleanNote
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
                    Note = cleanNote
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

        var validInputItems = itemsDto.Items.Where(i => i.MenuItemId.HasValue && i.MenuItemId.Value != Guid.Empty).ToList();
        if (validInputItems.Count == 0)
            throw new ArgumentException("Danh sách món bổ sung không hợp lệ.");

        var requestedItemIds = validInputItems.Select(x => x.MenuItemId!.Value).Distinct().ToList();
        var menuItems = await _context.MenuItems
            .Where(m => requestedItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        foreach (var req in validInputItems)
        {
            if (!menuItems.TryGetValue(req.MenuItemId!.Value, out var menuItem))
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

        foreach (var itemDto in validInputItems)
        {
            var menuItem = menuItems[itemDto.MenuItemId!.Value];
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

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Đơn hàng đã đóng, không thể xác nhận ra món.");

        var orderItem = order.OrderItems.FirstOrDefault(oi => oi.Id == itemId);
        if (orderItem == null)
            throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        if (orderItem.MenuItemId == null)
            throw new InvalidOperationException("Chỉ có thể xác nhận ra món trên từng món ăn cụ thể trong đơn.");

        if (orderItem.Status == OrderItemStatus.Cancelled)
            throw new InvalidOperationException("Món ăn đã bị hủy, không thể xác nhận ra món.");

        if (orderItem.Status == OrderItemStatus.Hold)
            throw new InvalidOperationException("Món ăn vẫn đang ở trạng thái chờ (Hold), chưa được bắn lệnh chế biến.");

        if (orderItem.Status == OrderItemStatus.Served)
            return true;

        var now = DateTime.UtcNow;
        var servedById = await ResolveExistingStaffIdOrNullAsync(_currentUserService.UserId, ct);

        orderItem.Status = OrderItemStatus.Served;
        orderItem.ServedAt = now;
        orderItem.ServedById = servedById;
        orderItem.IsRush = false;

        if (orderItem.TastingMenuId.HasValue)
        {
            SynchronizeTastingMenuHeaders(order, orderItem.TastingMenuId.Value, now, servedById);
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

        if (orderItem.MenuItemId == null)
            throw new InvalidOperationException("Chỉ có thể yêu cầu làm lại trên từng món ăn cụ thể trong đơn.");

        if (orderItem.Status == OrderItemStatus.Cancelled)
            throw new InvalidOperationException("Món đã bị hủy, không thể yêu cầu chế biến lại.");

        var reason = string.IsNullOrWhiteSpace(dto?.Reason)
            ? "Yêu cầu làm lại từ quầy Pass"
            : dto!.Reason!.Trim();

        var now = DateTime.UtcNow;
        orderItem.Status = OrderItemStatus.Preparing;
        orderItem.IsRush = true;
        orderItem.FiredAt = now;
        orderItem.ServedAt = null;
        orderItem.ServedById = null;
        orderItem.Note = string.IsNullOrWhiteSpace(orderItem.Note)
            ? $"[LÀM LẠI: {reason}]"
            : $"{orderItem.Note} | [LÀM LẠI: {reason}]";

        if (orderItem.TastingMenuId.HasValue)
        {
            SynchronizeTastingMenuHeaders(order, orderItem.TastingMenuId.Value, now, null);
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
            .Include(o => o.CreateBy)
            .Include(o => o.Reservation)
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
            .Include(o => o.CreateBy)
            .Include(o => o.Reservation)
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
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Đơn hàng đã hoàn tất hoặc đã hủy, không thể hủy món.");

        var orderItem = order.OrderItems.FirstOrDefault(oi => oi.Id == itemId);
        if (orderItem == null)
            throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        if (orderItem.Status == OrderItemStatus.Served)
            throw new InvalidOperationException("Món đã phục vụ lên bàn khách, không thể hủy.");

        if (orderItem.Status == OrderItemStatus.Cancelled)
            return true;

        var trimmedReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();

        if (orderItem.MenuItemId == null && orderItem.TastingMenuId.HasValue)
        {
            var tmId = orderItem.TastingMenuId.Value;
            var children = order.OrderItems.Where(oi => oi.TastingMenuId == tmId && oi.MenuItemId != null).ToList();
            if (children.Any(c => c.Status == OrderItemStatus.Served))
                throw new InvalidOperationException("Set Menu đã có món phục vụ lên bàn khách, không thể hủy trọn gói.");

            orderItem.Status = OrderItemStatus.Cancelled;
            AppendCancelNote(orderItem, trimmedReason);

            foreach (var child in children.Where(c => c.Status != OrderItemStatus.Cancelled))
            {
                child.Status = OrderItemStatus.Cancelled;
                child.IsRush = false;
                AppendCancelNote(child, trimmedReason);
            }
        }
        else
        {
            orderItem.Status = OrderItemStatus.Cancelled;
            orderItem.IsRush = false;
            AppendCancelNote(orderItem, trimmedReason);

            if (orderItem.TastingMenuId.HasValue)
            {
                SynchronizeTastingMenuHeaders(order, orderItem.TastingMenuId.Value, DateTime.UtcNow, null);
            }
        }

        await _context.SaveChangesAsync(ct);

        await _kitchenNotifier.NotifyItemCancelledAsync(
            id,
            order.Table?.TableNumber ?? "N/A",
            orderItem.Id,
            orderItem.MenuItem?.Name ?? orderItem.TastingMenu?.Name ?? "Món ăn",
            trimmedReason,
            ct);

        return true;
    }

    private static void AppendCancelNote(OrderItem item, string? reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) return;
        item.Note = string.IsNullOrWhiteSpace(item.Note)
            ? $"[HỦY: {reason}]"
            : $"{item.Note} | [HỦY: {reason}]";
    }

    private static void SynchronizeTastingMenuHeaders(Order order, Guid tastingMenuId, DateTime now, Guid? servedById)
    {
        var children = order.OrderItems
            .Where(oi => oi.TastingMenuId == tastingMenuId && oi.MenuItemId != null)
            .ToList();

        if (children.Count == 0) return;

        var headers = order.OrderItems
            .Where(oi => oi.TastingMenuId == tastingMenuId && oi.MenuItemId == null)
            .ToList();

        if (children.All(c => c.Status == OrderItemStatus.Cancelled))
        {
            foreach (var header in headers)
            {
                header.Status = OrderItemStatus.Cancelled;
                header.ServedAt = null;
                header.ServedById = null;
            }
        }
        else if (children.Any(c => c.Status == OrderItemStatus.Served) &&
                 children.All(c => c.Status == OrderItemStatus.Served || c.Status == OrderItemStatus.Cancelled))
        {
            foreach (var header in headers.Where(h => h.Status != OrderItemStatus.Cancelled))
            {
                header.Status = OrderItemStatus.Served;
                header.ServedAt ??= now;
                header.ServedById ??= servedById;
            }
        }
        else
        {
            foreach (var header in headers.Where(h => h.Status == OrderItemStatus.Served))
            {
                header.Status = OrderItemStatus.Hold;
                header.ServedAt = null;
                header.ServedById = null;
            }
        }
    }

    public async Task<List<OrderItemDetailDto>> GetKitchenPendingOrdersAsync(CancellationToken ct = default)
    {
        var pendingItems = await _context.OrderItems
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .Include(oi => oi.MenuItem)
            .AsNoTracking()
            .Where(oi => (oi.Status == OrderItemStatus.Preparing || oi.Status == OrderItemStatus.Hold) &&
                         oi.MenuItemId != null &&
                         oi.Order.Status == OrderStatus.Processing)
            .OrderBy(oi => oi.Status == OrderItemStatus.Preparing ? 0 : 1)
            .ThenByDescending(oi => oi.IsRush)
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
            oi.TastingMenuId,
            oi.Order?.TableId ?? Guid.Empty,
            oi.ServedById
        )).ToList();
    }

    private void EnsureExpediterOrManagerPermission()
    {
        var role = _currentUserService.Role;
        if (!_currentUserService.IsAuthenticated ||
            string.IsNullOrWhiteSpace(role) ||
            (!string.Equals(role, nameof(StaffRole.Expediter), StringComparison.OrdinalIgnoreCase) &&
             !string.Equals(role, nameof(StaffRole.Admin), StringComparison.OrdinalIgnoreCase) &&
             !string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase)))
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

    private async Task<Reservation?> ResolveActiveReservationAsync(Table table, Guid? requestedReservationId, CancellationToken ct)
    {
        if (requestedReservationId.HasValue && requestedReservationId.Value != Guid.Empty)
        {
            var explicitRes = await _context.Reservations.FirstOrDefaultAsync(r => r.Id == requestedReservationId.Value, ct);
            if (explicitRes == null)
                throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {requestedReservationId.Value}.");

            if (explicitRes.Status != ReservationStatus.Confirmed && explicitRes.Status != ReservationStatus.Completed)
                throw new InvalidOperationException($"Đơn đặt bàn {explicitRes.BookingCode} đang ở trạng thái {explicitRes.Status}, chỉ đơn đã xác nhận đặt cọc hoặc đã check-in mới được tạo Order.");

            return explicitRes;
        }

        // Automatically bind to checked-in or active confirmed reservation on this table that hasn't been settled yet
        var settledReservationIds = await _context.Orders
            .Where(o => o.TableId == table.Id && o.ReservationId != null && o.Status == OrderStatus.Completed)
            .Select(o => o.ReservationId!.Value)
            .ToListAsync(ct);

        var checkedIn = await _context.Reservations
            .Where(r => r.TableId == table.Id &&
                        r.Status == ReservationStatus.Completed &&
                        !settledReservationIds.Contains(r.Id))
            .OrderByDescending(r => r.ReservationTime)
            .FirstOrDefaultAsync(ct);

        if (checkedIn != null)
            return checkedIn;

        var now = DateTime.UtcNow;
        var confirmed = await _context.Reservations
            .Where(r => r.TableId == table.Id &&
                        r.Status == ReservationStatus.Confirmed &&
                        !settledReservationIds.Contains(r.Id) &&
                        (table.Status == TableStatus.Reserved ||
                         (r.ReservationTime >= now.AddHours(-4) && r.ReservationTime <= now.AddHours(4))))
            .OrderBy(r => r.ReservationTime)
            .FirstOrDefaultAsync(ct);

        return confirmed;
    }

    private static OrderDetailDto MapOrderDetail(Order order)
    {
        var tableNumber = order.Table?.TableNumber ?? "N/A";
        var guestCount = order.Reservation?.PartySize
            ?? order.OrderItems.Where(oi => oi.TastingMenuId != null).Select(oi => (int?)oi.Quantity).FirstOrDefault()
            ?? 2;

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
                oi.TastingMenuId,
                order.TableId,
                oi.ServedById
            )).ToList(),
            order.ReservationId,
            order.IsPriority,
            order.CreateById,
            order.CreateBy?.FullName ?? "Nhân viên",
            guestCount
        );
    }
}
