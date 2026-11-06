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
        var table = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {tableId}.");

        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TableId == tableId && o.Status == OrderStatus.Processing, ct);

        if (order == null)
            throw new InvalidOperationException("Bàn hiện chưa có đơn gọi món đang phục vụ để yêu cầu thanh toán.");

        var hasServedItem = order.OrderItems.Any(oi => oi.Status == OrderItemStatus.Served);
        if (!hasServedItem)
            throw new InvalidOperationException("Bàn chưa có món ăn nào được phục vụ lên bàn, chưa thể gửi yêu cầu thanh toán.");

        var estimatedSubtotal = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served)
            .Sum(oi => oi.Quantity * oi.UnitPrice);

        await _tableNotifier.NotifyCheckoutRequestedAsync(table.Id, table.TableNumber, order.Id, estimatedSubtotal, ct);
        return true;
    }

    public async Task<InvoicePreviewDto> CalculateInvoiceAsync(Guid tableId, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
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

        var servedBillableItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served && oi.UnitPrice > 0m)
            .ToList();

        var subtotal = servedBillableItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * ServiceChargeRate, 2);
        var vatAmount = Math.Round((subtotal + serviceCharge) * VatRate, 2);

        var deductedDeposit = ResolvePaidDepositAmount(order);
        var finalAmount = Math.Max(0m, (subtotal + serviceCharge + vatAmount) - deductedDeposit);

        // Display billable lines (regular items or TastingMenu package headers) that aren't cancelled
        var displayItems = order.OrderItems
            .Where(oi => oi.Status != OrderItemStatus.Cancelled &&
                         (oi.UnitPrice > 0m || oi.TastingMenuId == null))
            .Select(oi => new InvoicePreviewItemDto(
                oi.MenuItem?.Name ?? oi.TastingMenu?.Name ?? "Món phục vụ",
                oi.Quantity,
                oi.UnitPrice,
                oi.Quantity * oi.UnitPrice,
                oi.Id,
                oi.Status.ToString()
            ))
            .ToList();

        var vietQrUrl = BuildVietQrUrl(order.Id, order.Table?.TableNumber ?? "BAN", finalAmount);

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
            VietQrUrl: vietQrUrl
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
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.TableId == tableId, ct);

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
        foreach (var header in order.OrderItems.Where(oi => oi.TastingMenuId != null && oi.MenuItemId == null && oi.Status == OrderItemStatus.Hold))
        {
            var children = order.OrderItems
                .Where(oi => oi.TastingMenuId == header.TastingMenuId && oi.MenuItemId != null)
                .ToList();

            if (children.Any(c => c.Status == OrderItemStatus.Served) && children.All(c => c.Status == OrderItemStatus.Served || c.Status == OrderItemStatus.Cancelled))
            {
                header.Status = OrderItemStatus.Served;
                header.ServedAt ??= DateTime.UtcNow;
            }
        }

        var servedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served && oi.UnitPrice > 0m)
            .ToList();

        if (servedItems.Count == 0)
            throw new InvalidOperationException("Đơn hàng chưa có món ăn nào đã phục vụ hợp lệ để xuất hóa đơn.");

        var subtotal = servedItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * ServiceChargeRate, 2);
        var vatAmount = Math.Round((subtotal + serviceCharge) * VatRate, 2);
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
        }

        await _context.SaveChangesAsync(ct);

        if (order.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(order.Table.Id, order.Table.TableNumber, order.Table.Status, ct);
        }

        return invoice.Id;
    }

    public async Task<InvoiceDto> GetInvoiceByIdAsync(Guid id, CancellationToken ct = default)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (invoice == null)
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn {id}.");

        var finalTotal = Math.Max(0m, (invoice.Subtotal + invoice.ServiceCharge + invoice.VatAmount) - invoice.DeductedDeposit);

        return new InvoiceDto(
            invoice.Id,
            invoice.OrderId,
            invoice.Order?.Table?.TableNumber ?? "N/A",
            invoice.Subtotal,
            invoice.ServiceCharge,
            invoice.VatAmount,
            invoice.DeductedDeposit,
            finalTotal,
            invoice.PaymentMethod,
            invoice.CreatedAt
        );
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(DateTime? date = null, CancellationToken ct = default)
    {
        var query = _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .AsNoTracking();

        if (date.HasValue)
        {
            var start = date.Value.Date;
            var end = start.AddDays(1);
            query = query.Where(i => i.CreatedAt >= start && i.CreatedAt < end);
        }

        var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync(ct);

        return invoices.Select(i => new InvoiceDto(
            i.Id,
            i.OrderId,
            i.Order?.Table?.TableNumber ?? "N/A",
            i.Subtotal,
            i.ServiceCharge,
            i.VatAmount,
            i.DeductedDeposit,
            Math.Max(0m, (i.Subtotal + i.ServiceCharge + i.VatAmount) - i.DeductedDeposit),
            i.PaymentMethod,
            i.CreatedAt
        )).ToList();
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
