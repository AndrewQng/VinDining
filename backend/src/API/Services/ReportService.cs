using System.Globalization;
using System.Text;

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
        var invoiceQuery = _context.Invoices.AsNoTracking().Where(i => i.IsPaid);
        var orderQuery = _context.Orders.AsNoTracking();
        var reservationQuery = _context.Reservations.AsNoTracking();
        var orderItemQuery = _context.OrderItems
            .Include(oi => oi.MenuItem)
            .Include(oi => oi.TastingMenu)
            .Include(oi => oi.Order)
            .AsNoTracking()
            .Where(oi => oi.Status == OrderItemStatus.Served);

        if (range.FromDate.HasValue)
        {
            var from = range.FromDate.Value;
            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt >= from);
            orderQuery = orderQuery.Where(o => o.OpenedAt >= from);
            reservationQuery = reservationQuery.Where(r => r.ReservationTime >= from);
            orderItemQuery = orderItemQuery.Where(oi => oi.Order.OpenedAt >= from);
        }

        if (range.ToDate.HasValue)
        {
            var to = range.ToDate.Value.TimeOfDay == TimeSpan.Zero
                ? range.ToDate.Value.Date.AddDays(1).AddTicks(-1)
                : range.ToDate.Value;

            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt <= to);
            orderQuery = orderQuery.Where(o => o.OpenedAt <= to);
            reservationQuery = reservationQuery.Where(r => r.ReservationTime <= to);
            orderItemQuery = orderItemQuery.Where(oi => oi.Order.OpenedAt <= to);
        }

        var invoices = await invoiceQuery.ToListAsync(ct);

        // Gross dining revenue includes full meal value (Subtotal + 5% ServiceCharge + 10% VAT)
        var totalRevenue = invoices.Sum(i => i.Subtotal + i.ServiceCharge + i.VatAmount);
        var deductedDepositTotal = invoices.Sum(i => i.DeductedDeposit);

        // Split shift revenue in Vietnam time (UTC+7): Lunch (< 16:00) vs Dinner (>= 16:00)
        var lunchRevenue = invoices
            .Where(i => i.CreatedAt.AddHours(7).Hour < 16)
            .Sum(i => i.Subtotal + i.ServiceCharge + i.VatAmount);

        var dinnerRevenue = totalRevenue - lunchRevenue;

        var totalOrders = await orderQuery.CountAsync(ct);
        var reservations = await reservationQuery
            .Include(r => r.Deposit)
            .ToListAsync(ct);

        var totalReservations = reservations.Count;
        var cancelledCount = reservations.Count(r => r.Status == ReservationStatus.Cancelled);
        var forfeitedDepositRevenue = reservations
            .Where(r => r.Status == ReservationStatus.Cancelled && r.Deposit != null && r.Deposit.Status == DepositStatus.Forfeited && r.Deposit.PaidAt != null)
            .Sum(r => r.Deposit!.Amount);

        var activeTables = await _context.Tables
            .AsNoTracking()
            .Where(t => t.IsActive)
            .ToListAsync(ct);

        double occupancyRate = 0.0;
        if (activeTables.Count > 0)
        {
            var busyCount = activeTables.Count(t => t.Status == TableStatus.Occupied || t.Status == TableStatus.Reserved);
            occupancyRate = Math.Round((busyCount * 100.0) / activeTables.Count, 1);
        }

        var servedItems = await orderItemQuery.ToListAsync(ct);
        var topItems = servedItems
            .Where(oi => oi.MenuItem != null || oi.TastingMenu != null)
            .GroupBy(oi => oi.MenuItem != null ? oi.MenuItem.Name : oi.TastingMenu!.Name)
            .Select(g => new TopSellingItemDto(
                g.Key,
                g.Sum(x => x.Quantity),
                g.Sum(x => x.Quantity * x.UnitPrice)
            ))
            .OrderByDescending(x => x.QuantitySold)
            .ThenByDescending(x => x.Revenue)
            .Take(10)
            .ToList();

        var ratings = await _context.Feedbacks.AsNoTracking().Select(f => f.Rating).ToListAsync(ct);
        var avgRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 2) : 0.0;

        return new DashboardMetricsDto(
            totalRevenue,
            totalOrders,
            totalReservations,
            occupancyRate,
            topItems,
            lunchRevenue,
            dinnerRevenue,
            deductedDepositTotal,
            forfeitedDepositRevenue,
            cancelledCount,
            avgRating
        );
    }

    public async Task<byte[]> ExportRevenueReportAsync(DateRangeDto range, CancellationToken ct = default)
    {
        var metrics = await GetMetricsAsync(range, ct);

        var invoiceQuery = _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .Include(i => i.SettleBy)
            .AsNoTracking()
            .Where(i => i.IsPaid);

        if (range.FromDate.HasValue)
            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt >= range.FromDate.Value);

        if (range.ToDate.HasValue)
        {
            var to = range.ToDate.Value.TimeOfDay == TimeSpan.Zero
                ? range.ToDate.Value.Date.AddDays(1).AddTicks(-1)
                : range.ToDate.Value;
            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt <= to);
        }

        var invoices = await invoiceQuery.OrderByDescending(i => i.CreatedAt).ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("BAO CAO DOANH THU NHA HANG FINE DINING VINDINING");
        sb.AppendLine($"Tu ngay,{(range.FromDate.HasValue ? range.FromDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "Tat ca")},Den ngay,{(range.ToDate.HasValue ? range.ToDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "Hien tai")}");
        sb.AppendLine($"Tong doanh thu gop (VND),{metrics.TotalRevenue.ToString("0.##", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Doanh thu ca trua (VND),{metrics.LunchShiftRevenue.ToString("0.##", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Doanh thu ca toi (VND),{metrics.DinnerShiftRevenue.ToString("0.##", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Tong tien coc can tru (VND),{metrics.DeductedDepositTotal.ToString("0.##", CultureInfo.InvariantCulture)}");
        sb.AppendLine($"Tong so don phuc vu,{metrics.TotalOrders}");
        sb.AppendLine($"Tong luot dat ban,{metrics.TotalReservations}");
        sb.AppendLine($"So luot huy dat ban,{metrics.CancelledReservationsCount}");
        sb.AppendLine($"Ty le lap day ban (%),{metrics.OccupancyRate.ToString("0.0", CultureInfo.InvariantCulture)}");
        sb.AppendLine();

        sb.AppendLine("TOP MON AN BAN CHAY");
        sb.AppendLine("Ten mon an,So luong phuc vu,Doanh thu (VND)");
        foreach (var item in metrics.TopSellingItems)
        {
            sb.AppendLine($"{EscapeCsv(item.MenuItemName)},{item.QuantitySold},{item.Revenue.ToString("0.##", CultureInfo.InvariantCulture)}");
        }
        sb.AppendLine();

        sb.AppendLine("CHI TIET HOA DON QUYET TOAN");
        sb.AppendLine("Ma hoa don,So ban,Thoi gian thanh toan (UTC),Tam tinh,Phi dich vu 5%,VAT 10%,Coc can tru,Khach thanh toan them,Phuong thuc,Thu ngan");
        foreach (var inv in invoices)
        {
            var finalPay = Math.Max(0m, inv.Subtotal + inv.ServiceCharge + inv.VatAmount - inv.DeductedDeposit);
            sb.AppendLine(string.Join(",",
                inv.Id,
                EscapeCsv(inv.Order?.Table?.TableNumber ?? "N/A"),
                inv.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                inv.Subtotal.ToString("0.##", CultureInfo.InvariantCulture),
                inv.ServiceCharge.ToString("0.##", CultureInfo.InvariantCulture),
                inv.VatAmount.ToString("0.##", CultureInfo.InvariantCulture),
                inv.DeductedDeposit.ToString("0.##", CultureInfo.InvariantCulture),
                finalPay.ToString("0.##", CultureInfo.InvariantCulture),
                inv.PaymentMethod,
                EscapeCsv(inv.SettleBy?.FullName ?? "System")
            ));
        }

        // Prefix UTF-8 BOM so Excel opens Vietnamese headers cleanly
        var preamble = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(sb.ToString());
        var output = new byte[preamble.Length + body.Length];
        Buffer.BlockCopy(preamble, 0, output, 0, preamble.Length);
        Buffer.BlockCopy(body, 0, output, preamble.Length, body.Length);
        return output;
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
