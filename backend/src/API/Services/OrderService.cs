namespace API.Services;

public class OrderService : IOrderService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IKitchenNotifier _kitchenNotifier;

    public OrderService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IKitchenNotifier kitchenNotifier)
    {
        _context = context;
        _currentUserService = currentUserService;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Guid> CreateOrderWithCoursesAsync(CreateOrderDto dto, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == dto.TableId, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {dto.TableId}.");

        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp.");

        var staffId = dto.StaffId ?? _currentUserService.UserId;
        if (!staffId.HasValue || staffId == Guid.Empty)
        {
            var defaultStaff = await _context.Staffs.FirstOrDefaultAsync(s => s.IsActive, ct);
            staffId = defaultStaff?.Id ?? Guid.NewGuid();
        }

        var requestedItemIds = dto.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _context.MenuItems
            .Where(m => requestedItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TableId = table.Id,
            ReservationId = dto.ReservationId,
            CreateById = staffId.Value,
            Status = OrderStatus.Processing,
            OpenedAt = DateTime.UtcNow
        };

        var foodCourses = menuItems.Values
            .Where(m => m.CourseType != CourseType.Beverage)
            .Select(m => m.CourseType)
            .ToList();

        var firstCourse = foodCourses.Count != 0 ? foodCourses.Min() : CourseType.Appetizer;

        foreach (var itemDto in dto.Items)
        {
            if (!menuItems.TryGetValue(itemDto.MenuItemId, out var menuItem)) continue;

            var isImmediate = menuItem.CourseType == CourseType.Beverage || menuItem.CourseType == firstCourse;
            var initialStatus = isImmediate ? OrderItemStatus.Preparing : OrderItemStatus.Hold;
            var firedAt = isImmediate ? DateTime.UtcNow : (DateTime?)null;

            order.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                Quantity = itemDto.Quantity,
                UnitPrice = menuItem.Price,
                Status = initialStatus,
                FiredAt = firedAt,
                Note = itemDto.Note
            });
        }

        table.Status = TableStatus.Occupied;

        await _context.Orders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);

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

        if (order == null) throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        var itemsToFire = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Hold && oi.MenuItem?.CourseType == dto.CourseType)
            .ToList();

        if (itemsToFire.Count == 0) return 0;

        var now = DateTime.UtcNow;
        foreach (var item in itemsToFire)
        {
            item.Status = OrderItemStatus.Preparing;
            item.FiredAt = now;
        }

        await _context.SaveChangesAsync(ct);
        await _kitchenNotifier.NotifyCourseFiredAsync(order.Id, order.Table?.TableNumber ?? "N/A", dto.CourseType, ct);
        return itemsToFire.Count;
    }

    public async Task<int> AddOrderItemsAsync(Guid id, AddItemsDto itemsDto, CancellationToken ct = default)
    {
        var order = await _context.Orders.Include(o => o.Table).Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order == null) throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");

        var requestedItemIds = itemsDto.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _context.MenuItems
            .Where(m => requestedItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        foreach (var itemDto in itemsDto.Items)
        {
            if (!menuItems.TryGetValue(itemDto.MenuItemId, out var menuItem)) continue;

            order.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                Quantity = itemDto.Quantity,
                UnitPrice = menuItem.Price,
                Status = OrderItemStatus.Preparing,
                FiredAt = DateTime.UtcNow,
                Note = itemDto.Note
            });
        }

        await _context.SaveChangesAsync(ct);
        await _kitchenNotifier.NotifyNewOrderAsync(order.Id, order.Table?.TableNumber ?? "N/A", ct);
        return itemsDto.Items.Count;
    }

    public async Task<bool> ConfirmServedAsync(Guid id, Guid itemId, CancellationToken ct = default)
    {
        var orderItem = await _context.OrderItems
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .Include(oi => oi.MenuItem)
            .FirstOrDefaultAsync(oi => oi.OrderId == id && oi.Id == itemId, ct);

        if (orderItem == null) throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        orderItem.Status = OrderItemStatus.Served;
        orderItem.ServedAt = DateTime.UtcNow;
        orderItem.ServedById = _currentUserService.UserId;

        await _context.SaveChangesAsync(ct);

        await _kitchenNotifier.NotifyItemServedAsync(
            id,
            orderItem.Order?.Table?.TableNumber ?? "N/A",
            itemId,
            orderItem.MenuItem?.Name ?? "Món",
            _currentUserService.UserId,
            ct);

        return true;
    }

    public async Task<OrderDetailDto?> GetActiveOrderByTableAsync(Guid tableId, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
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
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null) throw new KeyNotFoundException($"Không tìm thấy đơn hàng {id}.");
        return MapOrderDetail(order);
    }

    public async Task<bool> CancelOrderItemAsync(Guid id, Guid itemId, CancellationToken ct = default)
    {
        var orderItem = await _context.OrderItems.FirstOrDefaultAsync(oi => oi.OrderId == id && oi.Id == itemId, ct);
        if (orderItem == null) throw new KeyNotFoundException("Món không tồn tại trong đơn hàng.");

        if (orderItem.Status == OrderItemStatus.Served)
            throw new InvalidOperationException("Món đã ra bàn (Served), không thể hủy.");

        orderItem.Status = OrderItemStatus.Cancelled;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<OrderItemDetailDto>> GetKitchenPendingOrdersAsync(CancellationToken ct = default)
    {
        var pendingItems = await _context.OrderItems
            .Include(oi => oi.MenuItem)
            .Where(oi => oi.Status == OrderItemStatus.Preparing)
            .OrderBy(oi => oi.FiredAt)
            .AsNoTracking()
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
            oi.Note
        )).ToList();
    }

    private static OrderDetailDto MapOrderDetail(Order order)
    {
        return new OrderDetailDto(
            order.Id,
            order.TableId,
            order.Table?.TableNumber ?? "N/A",
            order.Status,
            order.OpenedAt,
            order.ClosedAt,
            order.OrderItems.Select(oi => new OrderItemDetailDto(
                oi.Id,
                oi.MenuItemId ?? Guid.Empty,
                oi.MenuItem?.Name ?? "N/A",
                oi.UnitPrice,
                oi.Quantity,
                oi.Status,
                oi.MenuItem?.CourseType ?? CourseType.MainCourse,
                oi.FiredAt,
                oi.Note
            )).ToList()
        );
    }
}
