using API.Models.Common;

namespace API.Services;

public class InvoiceService : IInvoiceService
{
    private const decimal ServiceChargeRate = 0.05m;
    private const decimal VatRate = 0.10m;

    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITableNotifier _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;

    public InvoiceService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITableNotifier tableNotifier,
        ITableConcurrencyLock? tableLock = null)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? DefaultTableLock;
    }

    public async Task<bool> RequestCheckoutAsync(Guid tableId, CancellationToken ct = default)
    {
        await using var lockHandle = await _tableLock.AcquireAsync(tableId, ct);

        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == tableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {tableId}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện đang ngưng hoạt động.");

        if (table.Status != TableStatus.Occupied && table.Status != TableStatus.PaymentPending)
            throw new InvalidOperationException($"Bàn {table.TableNumber} không ở trạng thái đang phục vụ, chưa thể gửi yêu cầu thanh toán.");

        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TableId == tableId && o.Status == OrderStatus.Processing, ct);

        if (order == null)
            throw new InvalidOperationException("Bàn hiện chưa có đơn gọi món đang phục vụ để yêu cầu thanh toán.");

        var hasServedDish = order.OrderItems.Any(oi => oi.MenuItemId != null && oi.Status == OrderItemStatus.Served);
        if (!hasServedDish)
            throw new InvalidOperationException("Bàn chưa có món ăn nào được phục vụ lên bàn, chưa thể gửi yêu cầu thanh toán.");

        var statusChanged = table.Status != TableStatus.PaymentPending;
        table.Status = TableStatus.PaymentPending;
        table.CheckoutRequestedAt ??= DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        var estimatedSubtotal = CalculateBillableSubtotal(order);

        if (statusChanged)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        }
        await _tableNotifier.NotifyCheckoutRequestedAsync(table.Id, table.TableNumber, order.Id, estimatedSubtotal, ct);
        return true;
    }

    public async Task<InvoicePreviewDto> CalculateInvoiceAsync(Guid tableId, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.CreateBy)
            .Include(o => o.Reservation)
                .ThenInclude(r => r!.Deposit)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TableId == tableId && o.Status == OrderStatus.Processing, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng đang hoạt động cho bàn {tableId}.");

        var unservedKitchenItems = order.OrderItems
            .Where(oi => oi.MenuItemId != null &&
                         (oi.Status == OrderItemStatus.Hold || oi.Status == OrderItemStatus.Preparing))
            .ToList();

        var subtotal = CalculateBillableSubtotal(order);
        var serviceCharge = Math.Round(subtotal * ServiceChargeRate, 0, MidpointRounding.AwayFromZero);
        var vatAmount = Math.Round((subtotal + serviceCharge) * VatRate, 0, MidpointRounding.AwayFromZero);

        var deductedDeposit = ResolvePaidDepositAmount(order);
        var finalAmount = Math.Max(0m, (subtotal + serviceCharge + vatAmount) - deductedDeposit);

        var tastingMenuNames = order.OrderItems
            .Where(oi => oi.TastingMenuId.HasValue && oi.TastingMenu != null)
            .GroupBy(oi => oi.TastingMenuId!.Value)
            .ToDictionary(g => g.Key.ToString(), g => g.First().TastingMenu!.Name);

        var unitPrices = ResolveDishUnitPrices(order.OrderItems);

        // Return individual dish lines (including allocated Set Menu dish lines) that aren't cancelled
        var displayItems = order.OrderItems
            .Where(oi => oi.Status != OrderItemStatus.Cancelled && oi.MenuItemId != null)
            .Select(oi =>
            {
                var unitPrice = unitPrices.GetValueOrDefault(oi.Id, oi.UnitPrice);
                return new InvoicePreviewItemDto(
                    oi.MenuItem?.Name ?? "Món phục vụ",
                    oi.Quantity,
                    unitPrice,
                    oi.Quantity * unitPrice,
                    oi.Id,
                    oi.Status.ToString(),
                    order.Id,
                    oi.MenuItemId,
                    oi.TastingMenuId,
                    oi.MenuItem?.CourseType ?? CourseType.Appetizer,
                    oi.Note,
                    oi.IsRush && oi.Note != null && oi.Note.Contains("[LÀM LẠI:", StringComparison.OrdinalIgnoreCase),
                    0,
                    oi.IsRush,
                    oi.MenuItem?.PrepTimeMinutes ?? 15,
                    oi.FiredAt,
                    oi.ServedAt,
                    oi.ServedById
                );
            })
            .ToList();

        var vietQrUrl = BuildVietQrUrl(order.Id, order.Table?.TableNumber ?? "BAN", finalAmount);
        var guestCount = order.Reservation?.PartySize
            ?? order.OrderItems.Where(oi => oi.TastingMenuId != null).Select(oi => (int?)oi.Quantity).FirstOrDefault()
            ?? 2;

        return new InvoicePreviewDto(
            order.Id,
            order.TableId,
            order.Table?.TableNumber ?? "N/A",
            displayItems,
            subtotal,
            serviceCharge,
            vatAmount,
            deductedDeposit,
            finalAmount,
            HasUnservedItems: unservedKitchenItems.Count > 0,
            UnservedItemCount: unservedKitchenItems.Count,
            VietQrUrl: vietQrUrl,
            GuestCount: guestCount,
            WaiterName: order.CreateBy?.FullName,
            OpenedAt: order.OpenedAt,
            CheckoutRequestedAt: order.Table?.CheckoutRequestedAt,
            TastingMenuNames: tastingMenuNames
        );
    }

    public async Task<InvoicePreviewDto> PrintPreBillAsync(Guid tableId, CancellationToken ct = default)
    {
        return await CalculateInvoiceAsync(tableId, ct);
    }

    public async Task<Guid> SettleInvoiceByOrderAsync(SettleInvoiceDto dto, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {dto.OrderId}.");

        return await SettleInvoiceAsync(order.TableId, dto, ct);
    }

    public async Task<Guid> SettleInvoiceAsync(Guid tableId, SettleInvoiceDto dto, CancellationToken ct = default)
    {
        await using var lockHandle = await _tableLock.AcquireAsync(tableId, ct);

        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.Reservation)
                .ThenInclude(r => r!.Deposit)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(
                o => o.TableId == tableId &&
                     (dto.OrderId != Guid.Empty ? o.Id == dto.OrderId : o.Status == OrderStatus.Processing),
                ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {dto.OrderId} tại bàn {tableId}.");

        if (order.Invoice != null)
            throw new ConflictException("Đơn hàng này đã được xuất hóa đơn và quyết toán trước đó.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Chỉ có thể quyết toán cho đơn hàng đang trong quá trình phục vụ.");

        var unservedKitchenCount = order.OrderItems.Count(oi =>
            oi.MenuItemId != null &&
            (oi.Status == OrderItemStatus.Hold || oi.Status == OrderItemStatus.Preparing));

        if (unservedKitchenCount > 0)
        {
            throw new InvalidOperationException(
                $"Đơn hàng còn {unservedKitchenCount} món đang chờ hoặc đang chế biến chưa lên bàn. Vui lòng xác nhận phục vụ hoặc hủy món trước khi xuất hóa đơn.");
        }

        // Synchronize TastingMenu billing header status if all child courses were served or cancelled
        foreach (var header in order.OrderItems.Where(oi => oi.TastingMenuId != null && oi.MenuItemId == null && oi.Status != OrderItemStatus.Cancelled))
        {
            var children = order.OrderItems
                .Where(oi => oi.TastingMenuId == header.TastingMenuId && oi.MenuItemId != null)
                .ToList();

            if (children.Count > 0 && children.All(c => c.Status == OrderItemStatus.Cancelled))
            {
                header.Status = OrderItemStatus.Cancelled;
                header.ServedAt = null;
            }
            else if (children.Any(c => c.Status == OrderItemStatus.Served) &&
                     children.All(c => c.Status == OrderItemStatus.Served || c.Status == OrderItemStatus.Cancelled))
            {
                header.Status = OrderItemStatus.Served;
                header.ServedAt ??= DateTime.UtcNow;
            }
        }

        var unitPrices = ResolveDishUnitPrices(order.OrderItems);
        foreach (var dish in order.OrderItems.Where(oi => oi.MenuItemId != null && oi.UnitPrice <= 0m))
        {
            var resolved = unitPrices.GetValueOrDefault(dish.Id, 0m);
            if (resolved > 0m)
            {
                dish.UnitPrice = resolved;
            }
        }

        var servedItems = order.OrderItems
            .Where(oi => oi.MenuItemId != null && oi.Status == OrderItemStatus.Served && oi.UnitPrice > 0m)
            .ToList();

        if (servedItems.Count == 0)
            throw new InvalidOperationException("Đơn hàng chưa có món ăn nào đã phục vụ hợp lệ để xuất hóa đơn.");

        var subtotal = servedItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * ServiceChargeRate, 0, MidpointRounding.AwayFromZero);
        var vatAmount = Math.Round((subtotal + serviceCharge) * VatRate, 0, MidpointRounding.AwayFromZero);
        var deductedDeposit = ResolvePaidDepositAmount(order);

        var settleById = await ResolveSettlingStaffIdAsync(dto.StaffId, order.CreateById, ct);
        var now = DateTime.UtcNow;

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            SettleById = settleById,
            Subtotal = subtotal,
            ServiceCharge = serviceCharge,
            VatAmount = vatAmount,
            DeductedDeposit = deductedDeposit,
            PaymentMethod = dto.PaymentMethod,
            IsPaid = true,
            CreatedAt = now
        };

        await _context.Invoices.AddAsync(invoice, ct);

        order.Status = OrderStatus.Completed;
        order.ClosedAt = now;

        if (order.Reservation != null && order.Reservation.Status == ReservationStatus.Confirmed)
        {
            order.Reservation.Status = ReservationStatus.Completed;
        }

        if (order.Table != null)
        {
            order.Table.Status = TableStatus.Cleaning;
            order.Table.CheckoutRequestedAt = null;
            order.Table.CurrentGuestCount = null;
        }

        await _context.SaveChangesAsync(ct);

        if (order.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(order.Table.Id, order.Table.TableNumber, order.Table.Status, ct);
        }
        await _tableNotifier.NotifyInvoiceSettledAsync(invoice.Id, order.TableId, ct);

        return invoice.Id;
    }

    public async Task<InvoiceDto> GetInvoiceByIdAsync(Guid id, CancellationToken ct = default)
    {
        var invoice = await _context.Invoices
            .Include(i => i.SettleBy)
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .Include(i => i.Order)
                .ThenInclude(o => o.CreateBy)
            .Include(i => i.Order)
                .ThenInclude(o => o.Reservation)
            .Include(i => i.Order)
                .ThenInclude(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
            .Include(i => i.Order)
                .ThenInclude(o => o.OrderItems)
                    .ThenInclude(oi => oi.TastingMenu)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (invoice == null)
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn {id}.");

        return MapInvoiceDto(invoice);
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(DateTime? date = null, CancellationToken ct = default)
    {
        var query = _context.Invoices
            .Include(i => i.SettleBy)
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .Include(i => i.Order)
                .ThenInclude(o => o.CreateBy)
            .Include(i => i.Order)
                .ThenInclude(o => o.Reservation)
            .Include(i => i.Order)
                .ThenInclude(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
            .Include(i => i.Order)
                .ThenInclude(o => o.OrderItems)
                    .ThenInclude(oi => oi.TastingMenu)
            .AsNoTracking();

        if (date.HasValue)
        {
            var vnDate = date.Value.Date;
            var startUtc = vnDate.AddHours(-7);
            var endUtc = startUtc.AddDays(1);
            query = query.Where(i => i.CreatedAt >= startUtc && i.CreatedAt < endUtc);
        }

        var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync(ct);

        return invoices.Select(MapInvoiceDto).ToList();
    }

    private static InvoiceDto MapInvoiceDto(Invoice invoice)
    {
        var finalTotal = Math.Max(0m, (invoice.Subtotal + invoice.ServiceCharge + invoice.VatAmount) - invoice.DeductedDeposit);
        var order = invoice.Order;
        var guestCount = order?.Reservation?.PartySize
            ?? order?.OrderItems.Where(oi => oi.TastingMenuId != null).Select(oi => (int?)oi.Quantity).FirstOrDefault()
            ?? 2;

        var tastingMenuNames = order?.OrderItems
            .Where(oi => oi.TastingMenuId.HasValue && oi.TastingMenu != null)
            .GroupBy(oi => oi.TastingMenuId!.Value)
            .ToDictionary(g => g.Key.ToString(), g => g.First().TastingMenu!.Name)
            ?? new Dictionary<string, string>();

        var unitPrices = order != null
            ? ResolveDishUnitPrices(order.OrderItems)
            : new Dictionary<Guid, decimal>();

        var items = order?.OrderItems
            .Where(oi => oi.Status != OrderItemStatus.Cancelled && oi.MenuItemId != null)
            .Select(oi =>
            {
                var unitPrice = unitPrices.GetValueOrDefault(oi.Id, oi.UnitPrice);
                return new InvoicePreviewItemDto(
                    oi.MenuItem?.Name ?? "Món phục vụ",
                    oi.Quantity,
                    unitPrice,
                    oi.Quantity * unitPrice,
                    oi.Id,
                    "Served",
                    order.Id,
                    oi.MenuItemId,
                    oi.TastingMenuId,
                    oi.MenuItem?.CourseType ?? CourseType.Appetizer,
                    oi.Note,
                    false,
                    0,
                    oi.IsRush,
                    oi.MenuItem?.PrepTimeMinutes ?? 15,
                    oi.FiredAt,
                    oi.ServedAt,
                    oi.ServedById
                );
            })
            .ToList();

        return new InvoiceDto(
            invoice.Id,
            invoice.OrderId,
            order?.Table?.TableNumber ?? "N/A",
            invoice.Subtotal,
            invoice.ServiceCharge,
            invoice.VatAmount,
            invoice.DeductedDeposit,
            finalTotal,
            invoice.PaymentMethod,
            invoice.CreatedAt,
            order?.TableId ?? Guid.Empty,
            invoice.SettleById,
            invoice.SettleBy?.FullName ?? "Thu ngân",
            guestCount,
            order?.CreateBy?.FullName,
            items,
            tastingMenuNames,
            invoice.IsPaid,
            $"survey-{invoice.Id}",
            null
        );
    }

    public static List<decimal> AllocateSetMenuUnitPrices(decimal setMenuPrice, IReadOnlyList<decimal> componentPrices)
    {
        if (componentPrices == null || componentPrices.Count == 0)
            return new List<decimal>();

        var target = Math.Max(0m, Math.Round(setMenuPrice, 0));
        var rawTotal = componentPrices.Sum(p => Math.Max(0m, p));

        if (rawTotal <= 0m)
        {
            var basePrice = Math.Floor(target / componentPrices.Count);
            var remainder = target - (basePrice * componentPrices.Count);
            return componentPrices.Select((_, i) => i == 0 ? basePrice + remainder : basePrice).ToList();
        }

        var allocated = componentPrices
            .Select(p => Math.Floor((Math.Max(0m, p) / rawTotal) * target))
            .ToList();

        var allocatedSum = allocated.Sum();
        allocated[0] += target - allocatedSum;
        return allocated;
    }

    public static Dictionary<Guid, decimal> ResolveDishUnitPrices(IEnumerable<OrderItem> orderItems)
    {
        var items = orderItems.ToList();
        var prices = new Dictionary<Guid, decimal>(items.Count);

        foreach (var oi in items)
        {
            if (oi.MenuItemId != null && oi.UnitPrice > 0m)
            {
                prices[oi.Id] = oi.UnitPrice;
            }
        }

        var setGroups = items
            .Where(oi => oi.TastingMenuId.HasValue && oi.MenuItemId != null)
            .GroupBy(oi => oi.TastingMenuId!.Value);

        foreach (var group in setGroups)
        {
            var dishes = group
                .OrderBy(oi => oi.MenuItem?.CourseType ?? CourseType.Appetizer)
                .ThenBy(oi => oi.Id)
                .ToList();

            if (dishes.All(d => prices.ContainsKey(d.Id)))
                continue;

            var header = items.FirstOrDefault(oi => oi.TastingMenuId == group.Key && oi.MenuItemId == null);
            var setPrice = header?.UnitPrice
                ?? dishes.Select(d => d.TastingMenu?.Price).FirstOrDefault(p => p.HasValue && p.Value > 0m)
                ?? 0m;

            var componentPrices = dishes.Select(d => d.MenuItem?.Price ?? 0m).ToList();
            var allocated = AllocateSetMenuUnitPrices(setPrice, componentPrices);

            for (var i = 0; i < dishes.Count; i++)
            {
                if (!prices.ContainsKey(dishes[i].Id))
                {
                    prices[dishes[i].Id] = allocated[i];
                }
            }
        }

        return prices;
    }

    private static decimal CalculateBillableSubtotal(Order order)
    {
        var unitPrices = ResolveDishUnitPrices(order.OrderItems);
        decimal subtotal = 0m;
        foreach (var oi in order.OrderItems)
        {
            if (oi.MenuItemId == null || oi.Status != OrderItemStatus.Served)
                continue;

            var unitPrice = unitPrices.GetValueOrDefault(oi.Id, oi.UnitPrice);
            if (unitPrice > 0m)
            {
                subtotal += oi.Quantity * unitPrice;
            }
        }

        return subtotal;
    }

    private static decimal ResolvePaidDepositAmount(Order order)
    {
        if (order.Reservation?.Deposit != null && order.Reservation.Deposit.Status == DepositStatus.Paid)
        {
            return order.Reservation.Deposit.Amount;
        }
        return 0m;
    }

    private async Task<Guid> ResolveSettlingStaffIdAsync(Guid? requestedStaffId, Guid fallbackStaffId, CancellationToken ct)
    {
        var candidate = requestedStaffId ?? _currentUserService.UserId;
        if (candidate.HasValue && candidate.Value != Guid.Empty)
        {
            if (await _context.Staffs.AnyAsync(s => s.Id == candidate.Value, ct))
                return candidate.Value;
        }

        if (fallbackStaffId != Guid.Empty && await _context.Staffs.AnyAsync(s => s.Id == fallbackStaffId, ct))
            return fallbackStaffId;

        var activeStaff = await _context.Staffs.FirstOrDefaultAsync(s => s.IsActive, ct);
        return activeStaff?.Id ?? fallbackStaffId;
    }

    private static string BuildVietQrUrl(Guid orderId, string tableNumber, decimal finalAmount)
    {
        var amount = (long)Math.Round(finalAmount, 0);
        var addInfo = Uri.EscapeDataString($"VINDINING {tableNumber} {orderId.ToString("N")[..6].ToUpperInvariant()}");
        return $"https://img.vietqr.io/image/VCB-0011009999999-compact2.png?amount={amount}&addInfo={addInfo}";
    }
}
