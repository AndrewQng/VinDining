namespace API.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITableNotifier _tableNotifier;

    public InvoiceService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITableNotifier tableNotifier)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tableNotifier = tableNotifier;
    }

    public async Task<bool> RequestCheckoutAsync(Guid tableId, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == tableId, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {tableId}.");

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.TableId == tableId && o.Status == OrderStatus.Processing, ct);

        if (order == null) throw new InvalidOperationException("Bàn chưa có đơn gọi món.");

        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
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
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.TableId == tableId && o.Status == OrderStatus.Processing, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng đang hoạt động cho bàn {tableId}.");

        var servedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served)
            .ToList();

        var subtotal = servedItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * 0.05m, 2);
        var vatAmount = Math.Round((subtotal + serviceCharge) * 0.10m, 2);

        var deductedDeposit = 0m;
        if (order.Reservation?.Deposit != null && order.Reservation.Deposit.Status == DepositStatus.Paid)
        {
            deductedDeposit = order.Reservation.Deposit.Amount;
        }

        var finalAmount = Math.Max(0m, (subtotal + serviceCharge + vatAmount) - deductedDeposit);

        var previewItems = servedItems.Select(oi => new InvoicePreviewItemDto(
            oi.MenuItem?.Name ?? "Món đã phục vụ",
            oi.Quantity,
            oi.UnitPrice,
            oi.Quantity * oi.UnitPrice
        )).ToList();

        return new InvoicePreviewDto(
            order.Id,
            order.TableId,
            order.Table?.TableNumber ?? "N/A",
            previewItems,
            subtotal,
            serviceCharge,
            vatAmount,
            deductedDeposit,
            finalAmount
        );
    }

    public Task<bool> PrintPreBillAsync(Guid tableId, CancellationToken ct = default)
    {
        return Task.FromResult(true);
    }

    public async Task<Guid> SettleInvoiceAsync(Guid tableId, SettleInvoiceDto dto, CancellationToken ct = default)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.Reservation)
                .ThenInclude(r => r!.Deposit)
            .Include(o => o.OrderItems)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.TableId == tableId, ct);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {dto.OrderId}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException("Chỉ có thể thanh toán đơn hàng đang phục vụ.");

        if (order.Invoice != null)
            throw new InvalidOperationException("Đơn hàng này đã được thanh toán.");

        var servedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served)
            .ToList();

        var subtotal = servedItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * 0.05m, 2);
        var vatAmount = Math.Round((subtotal + serviceCharge) * 0.10m, 2);

        var deductedDeposit = 0m;
        if (order.Reservation?.Deposit != null && order.Reservation.Deposit.Status == DepositStatus.Paid)
        {
            deductedDeposit = order.Reservation.Deposit.Amount;
        }

        var settleById = dto.StaffId ?? _currentUserService.UserId ?? order.CreateById;

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
            CreatedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);

        order.Status = OrderStatus.Completed;
        order.ClosedAt = DateTime.UtcNow;

        if (order.Table != null)
        {
            order.Table.Status = TableStatus.Cleaning;
            await _tableNotifier.NotifyTableStatusChangedAsync(order.Table.Id, order.Table.TableNumber, order.Table.Status, ct);
        }

        await _context.SaveChangesAsync(ct);
        return invoice.Id;
    }

    public async Task<InvoiceDto> GetInvoiceByIdAsync(Guid id, CancellationToken ct = default)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (invoice == null) throw new KeyNotFoundException($"Không tìm thấy hóa đơn {id}.");

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
}
