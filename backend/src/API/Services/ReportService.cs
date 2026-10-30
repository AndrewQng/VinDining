namespace API.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _context;

    public ReportService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardMetricsDto> GetMetricsAsync(DateRangeDto range, CancellationToken ct = default)
    {
        var invoiceQuery = _context.Invoices.AsNoTracking();
        var orderQuery = _context.Orders.AsNoTracking();
        var reservationQuery = _context.Reservations.AsNoTracking();

        if (range.FromDate.HasValue)
        {
            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt >= range.FromDate.Value);
            orderQuery = orderQuery.Where(o => o.OpenedAt >= range.FromDate.Value);
            reservationQuery = reservationQuery.Where(r => r.ReservationTime >= range.FromDate.Value);
        }

        if (range.ToDate.HasValue)
        {
            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt <= range.ToDate.Value);
            orderQuery = orderQuery.Where(o => o.OpenedAt <= range.ToDate.Value);
            reservationQuery = reservationQuery.Where(r => r.ReservationTime <= range.ToDate.Value);
        }

        var invoices = await invoiceQuery.ToListAsync(ct);
        var totalRevenue = invoices.Sum(i => Math.Max(0m, (i.Subtotal + i.ServiceCharge + i.VatAmount) - i.DeductedDeposit));
        var totalOrders = await orderQuery.CountAsync(ct);
        var totalReservations = await reservationQuery.CountAsync(ct);

        var topItems = await _context.OrderItems
            .Include(oi => oi.MenuItem)
            .Where(oi => oi.Status == OrderItemStatus.Served)
            .GroupBy(oi => oi.MenuItem!.Name)
            .Select(g => new TopSellingItemDto(
                g.Key,
                g.Sum(x => x.Quantity),
                g.Sum(x => x.Quantity * x.UnitPrice)
            ))
            .OrderByDescending(x => x.QuantitySold)
            .Take(5)
            .ToListAsync(ct);

        return new DashboardMetricsDto(
            totalRevenue,
            totalOrders,
            totalReservations,
            OccupancyRate: 85.5,
            topItems
        );
    }

    public Task<byte[]> ExportRevenueReportAsync(DateRangeDto range, CancellationToken ct = default)
    {
        return Task.FromResult(Array.Empty<byte>());
    }
}
