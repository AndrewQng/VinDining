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
        var isLunchShift = ResolveIsLunchShift(range.Shift);

        var invoiceQuery = _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .Include(i => i.Order)
                .ThenInclude(o => o.Reservation)
            .AsNoTracking()
            .Where(i => i.IsPaid);
        var orderQuery = _context.Orders
            .Include(o => o.Table)
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Completed);
        var reservationQuery = _context.Reservations
            .Include(r => r.Table)
            .AsNoTracking()
            .Where(r => !r.BookingCode.StartsWith("WALKIN-"));
        var feedbackQuery = _context.Feedbacks
            .Include(f => f.Reservation)
                .ThenInclude(r => r.Table)
            .AsNoTracking();
        var orderItemQuery = _context.OrderItems
            .Include(oi => oi.MenuItem)
            .Include(oi => oi.TastingMenu)
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .AsNoTracking()
            .Where(oi => oi.Order.Status == OrderStatus.Completed);

        if (range.FromDate.HasValue)
        {
            var from = range.FromDate.Value;
            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt >= from);
            orderQuery = orderQuery.Where(o => (o.ClosedAt ?? o.OpenedAt) >= from);
            reservationQuery = reservationQuery.Where(r => r.ReservationTime >= from);
            feedbackQuery = feedbackQuery.Where(f => f.CreatedAt >= from);
            orderItemQuery = orderItemQuery.Where(oi => (oi.Order.ClosedAt ?? oi.Order.OpenedAt) >= from);
        }

        if (range.ToDate.HasValue)
        {
            var to = range.ToDate.Value.TimeOfDay == TimeSpan.Zero
                ? range.ToDate.Value.Date.AddDays(1).AddTicks(-1)
                : range.ToDate.Value;

            invoiceQuery = invoiceQuery.Where(i => i.CreatedAt <= to);
            orderQuery = orderQuery.Where(o => (o.ClosedAt ?? o.OpenedAt) <= to);
            reservationQuery = reservationQuery.Where(r => r.ReservationTime <= to);
            feedbackQuery = feedbackQuery.Where(f => f.CreatedAt <= to);
            orderItemQuery = orderItemQuery.Where(oi => (oi.Order.ClosedAt ?? oi.Order.OpenedAt) <= to);
        }

        if (range.Zone.HasValue)
        {
            var zone = range.Zone.Value;
            invoiceQuery = invoiceQuery.Where(i => i.Order.Table.Zone == zone);
            orderQuery = orderQuery.Where(o => o.Table.Zone == zone);
            reservationQuery = reservationQuery.Where(r => r.Table.Zone == zone);
            feedbackQuery = feedbackQuery.Where(f => f.Reservation.Table.Zone == zone);
            orderItemQuery = orderItemQuery.Where(oi => oi.Order.Table.Zone == zone);
        }

        var invoices = await invoiceQuery.ToListAsync(ct);
        if (isLunchShift.HasValue)
        {
            invoices = invoices.Where(i => MatchesShift(i.CreatedAt, isLunchShift.Value)).ToList();
        }

        // Gross dining revenue recognizes full meal value (Subtotal + 5% ServiceCharge + 10% VAT) or minimum-spend deposit when higher
        var totalRevenue = invoices.Sum(i => Math.Max(i.Subtotal + i.ServiceCharge + i.VatAmount, i.DeductedDeposit));
        var deductedDepositTotal = invoices.Sum(i => i.DeductedDeposit);

        // Split shift revenue in Vietnam time (UTC+7): Lunch (< 16:00) vs Dinner (>= 16:00)
        var lunchRevenue = invoices
            .Where(i => i.CreatedAt.AddHours(7).Hour < 16)
            .Sum(i => Math.Max(i.Subtotal + i.ServiceCharge + i.VatAmount, i.DeductedDeposit));

        var dinnerRevenue = totalRevenue - lunchRevenue;

        var orderOpenedTimes = await orderQuery.Select(o => o.OpenedAt).ToListAsync(ct);
        if (isLunchShift.HasValue)
        {
            orderOpenedTimes = orderOpenedTimes.Where(t => MatchesShift(t, isLunchShift.Value)).ToList();
        }
        var totalOrders = orderOpenedTimes.Count;

        var reservations = await reservationQuery
            .Include(r => r.Deposit)
            .ToListAsync(ct);
        if (isLunchShift.HasValue)
        {
            reservations = reservations.Where(r => MatchesShift(r.ReservationTime, isLunchShift.Value)).ToList();
        }

        var totalReservations = reservations.Count;
        var cancelledCount = reservations.Count(r => r.Status == ReservationStatus.Cancelled);
        var forfeitedDepositRevenue = reservations
            .Where(r => r.Status == ReservationStatus.Cancelled && r.Deposit != null && r.Deposit.Status == DepositStatus.Forfeited && r.Deposit.PaidAt != null)
            .Sum(r => r.Deposit!.Amount);

        var activeTablesQuery = _context.Tables
            .AsNoTracking()
            .Where(t => t.IsActive);
        if (range.Zone.HasValue)
        {
            activeTablesQuery = activeTablesQuery.Where(t => t.Zone == range.Zone.Value);
        }
        var activeTables = await activeTablesQuery.ToListAsync(ct);

        double occupancyRate = 0.0;
        if (activeTables.Count > 0)
        {
            var busyCount = activeTables.Count(t =>
                t.Status == TableStatus.Occupied ||
                t.Status == TableStatus.PaymentPending ||
                t.Status == TableStatus.Reserved);
            occupancyRate = Math.Round((busyCount * 100.0) / activeTables.Count, 1);
        }

        var completedOrderItems = await orderItemQuery.ToListAsync(ct);
        if (isLunchShift.HasValue)
        {
            completedOrderItems = completedOrderItems
                .Where(oi => oi.Order != null && MatchesShift(oi.Order.OpenedAt, isLunchShift.Value))
                .ToList();
        }
        var topItems = BuildTopSellingItems(completedOrderItems);

        var bestSellers = topItems
            .Take(8)
            .Select(t => new BestSellerItemDto(
                string.IsNullOrEmpty(t.MenuItemId) ? t.MenuItemName : t.MenuItemId,
                t.MenuItemName,
                t.QuantitySold,
                t.Revenue))
            .ToList();

        var feedbackEntries = await feedbackQuery
            .Select(f => new { f.Rating, ReservationTime = f.Reservation != null ? (DateTime?)f.Reservation.ReservationTime : null, f.CreatedAt })
            .ToListAsync(ct);
        if (isLunchShift.HasValue)
        {
            feedbackEntries = feedbackEntries
                .Where(f => MatchesShift(f.ReservationTime ?? f.CreatedAt, isLunchShift.Value))
                .ToList();
        }
        var avgRating = feedbackEntries.Count > 0 ? Math.Round(feedbackEntries.Average(f => f.Rating), 2) : 0.0;
        var avgRating1Dec = feedbackEntries.Count > 0 ? Math.Round(feedbackEntries.Average(f => f.Rating), 1) : 0.0;
        var feedbackSummary = new ReportFeedbackSummaryDto(
            feedbackEntries.Count,
            avgRating1Dec,
            avgRating1Dec,
            avgRating1Dec);

        var totalGuests = invoices.Sum(i => i.Order?.Reservation?.PartySize ?? 2);
        var cancellationRate = totalReservations > 0
            ? Math.Round((cancelledCount * 100.0) / totalReservations, 1)
            : 0.0;

        var zonesToAggregate = range.Zone.HasValue
            ? new[] { range.Zone.Value }
            : new[] { TableZone.MainHall, TableZone.VIP, TableZone.Balcony };

        var revenueByZone = zonesToAggregate.Select(z =>
        {
            var zInvoices = invoices.Where(i => i.Order?.Table?.Zone == z).ToList();
            var zReservations = reservations.Where(r => r.Table?.Zone == z).ToList();
            return new ZoneRevenueDto(
                z,
                zInvoices.Sum(i => Math.Max(i.Subtotal + i.ServiceCharge + i.VatAmount, i.DeductedDeposit)),
                zInvoices.Sum(i => i.Order?.Reservation?.PartySize ?? 2),
                zReservations.Count);
        }).ToList();

        var normalizedPeriod = NormalizePeriod(range.Period);
        var fromBound = range.FromDate ?? DateTime.UtcNow.Date.AddDays(-29);
        var toBound = range.ToDate ?? DateTime.UtcNow;
        var periodLabel = !string.IsNullOrWhiteSpace(range.Label)
            ? range.Label.Trim()
            : $"{fromBound:dd/MM/yyyy} – {toBound:dd/MM/yyyy}";
        var revenueSeries = BuildRevenueSeries(normalizedPeriod, fromBound, toBound, invoices);
        var hasData = invoices.Count > 0 || totalReservations > 0 || totalOrders > 0;

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
            avgRating,
            normalizedPeriod,
            fromBound.ToString("O"),
            toBound.ToString("O"),
            periodLabel,
            hasData,
            totalGuests,
            cancellationRate,
            revenueSeries,
            bestSellers,
            revenueByZone,
            feedbackSummary
        );
    }

    public async Task<byte[]> ExportRevenueReportAsync(DateRangeDto range, CancellationToken ct = default)
    {
        var isLunchShift = ResolveIsLunchShift(range.Shift);
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

        if (range.Zone.HasValue)
            invoiceQuery = invoiceQuery.Where(i => i.Order.Table.Zone == range.Zone.Value);

        var invoices = await invoiceQuery.OrderByDescending(i => i.CreatedAt).ToListAsync(ct);
        if (isLunchShift.HasValue)
        {
            invoices = invoices.Where(i => MatchesShift(i.CreatedAt, isLunchShift.Value)).ToList();
        }

        var zoneLabel = range.Zone.HasValue ? range.Zone.Value.ToString() : "Tat ca";
        var shiftLabel = isLunchShift.HasValue ? (isLunchShift.Value ? "Lunch" : "Dinner") : "Tat ca";

        var sb = new StringBuilder();
        sb.AppendLine("BAO CAO DOANH THU NHA HANG FINE DINING VINDINING");
        sb.AppendLine($"Tu ngay,{(range.FromDate.HasValue ? range.FromDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "Tat ca")},Den ngay,{(range.ToDate.HasValue ? range.ToDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "Hien tai")}");
        sb.AppendLine($"Khu vuc,{zoneLabel},Ca phuc vu,{shiftLabel}");
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

    private static bool? ResolveIsLunchShift(string? shift)
    {
        if (string.IsNullOrWhiteSpace(shift))
            return null;

        var normalized = shift.Trim();
        if (normalized.Equals("Lunch", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Trua", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ca trua", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ca trưa", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Trưa", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (normalized.Equals("Dinner", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Toi", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ca toi", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ca tối", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Tối", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        throw new ArgumentException("Ca phục vụ chỉ nhận giá trị Lunch hoặc Dinner.");
    }

    private static bool MatchesShift(DateTime utcTime, bool isLunch)
    {
        var vnHour = utcTime.AddHours(7).Hour;
        return isLunch ? vnHour < 16 : vnHour >= 16;
    }

    private static string NormalizePeriod(string? period)
    {
        if (string.IsNullOrWhiteSpace(period)) return "month";
        var p = period.Trim().ToLowerInvariant();
        return p is "day" or "week" or "month" or "quarter" ? p : "month";
    }

    private static List<RevenueSeriesPointDto> BuildRevenueSeries(
        string period,
        DateTime from,
        DateTime to,
        List<Invoice> invoices)
    {
        static DateTime ToVnLocal(DateTime dt) =>
            (dt.Kind == DateTimeKind.Local ? dt.ToUniversalTime() : dt).AddHours(7);

        var fromVn = ToVnLocal(from);
        var toVn = ToVnLocal(to);
        var points = new List<RevenueSeriesPointDto>();

        if (period == "day")
        {
            for (int h = 10; h <= 22; h += 2)
            {
                var startVn = new DateTime(fromVn.Year, fromVn.Month, fromVn.Day, h, 0, 0, DateTimeKind.Unspecified);
                var endVn = startVn.AddHours(2).AddTicks(-1);
                var matching = invoices.Where(i =>
                {
                    var createdVn = ToVnLocal(i.CreatedAt);
                    return createdVn >= startVn && createdVn <= endVn;
                }).ToList();
                points.Add(new RevenueSeriesPointDto(
                    $"{h:D2}h",
                    matching.Sum(i => Math.Max(i.Subtotal + i.ServiceCharge + i.VatAmount, i.DeductedDeposit)),
                    matching.Sum(i => i.Order?.Reservation?.PartySize ?? 2)));
            }
            return points;
        }

        if (period == "quarter")
        {
            for (int m = 0; m < 3; m++)
            {
                var monthStartVn = new DateTime(fromVn.Year, fromVn.Month, 1, 0, 0, 0, DateTimeKind.Unspecified).AddMonths(m);
                var monthEndVn = monthStartVn.AddMonths(1).AddTicks(-1);
                var matching = invoices.Where(i =>
                {
                    var createdVn = ToVnLocal(i.CreatedAt);
                    return createdVn >= monthStartVn && createdVn <= monthEndVn;
                }).ToList();
                points.Add(new RevenueSeriesPointDto(
                    $"T{monthStartVn.Month}",
                    matching.Sum(i => Math.Max(i.Subtotal + i.ServiceCharge + i.VatAmount, i.DeductedDeposit)),
                    matching.Sum(i => i.Order?.Reservation?.PartySize ?? 2)));
            }
            return points;
        }

        var cursor = fromVn.Date;
        var lastDate = toVn.Date < cursor ? cursor : toVn.Date;
        if ((lastDate - cursor).TotalDays > 35)
        {
            cursor = lastDate.AddDays(-29);
        }

        while (cursor <= lastDate)
        {
            var dayStartVn = cursor;
            var dayEndVn = cursor.AddDays(1).AddTicks(-1);
            var matching = invoices.Where(i =>
            {
                var createdVn = ToVnLocal(i.CreatedAt);
                return createdVn >= dayStartVn && createdVn <= dayEndVn;
            }).ToList();
            var label = period == "week" ? $"{cursor:dd/MM}" : cursor.Day.ToString();
            points.Add(new RevenueSeriesPointDto(
                label,
                matching.Sum(i => Math.Max(i.Subtotal + i.ServiceCharge + i.VatAmount, i.DeductedDeposit)),
                matching.Sum(i => i.Order?.Reservation?.PartySize ?? 2)));
            cursor = cursor.AddDays(1);
        }

        return points;
    }

    private static List<TopSellingItemDto> BuildTopSellingItems(List<OrderItem> completedOrderItems)
    {
        var resolvedUnitPrices = new Dictionary<Guid, decimal>();
        foreach (var orderGroup in completedOrderItems.GroupBy(oi => oi.OrderId))
        {
            if (orderGroup.Any(oi => oi.MenuItemId != null && oi.UnitPrice <= 0m))
            {
                foreach (var kv in InvoiceService.ResolveDishUnitPrices(orderGroup))
                {
                    resolvedUnitPrices[kv.Key] = kv.Value;
                }
            }
        }

        return completedOrderItems
            .Where(oi => oi.MenuItemId != null && oi.MenuItem != null && oi.Status == OrderItemStatus.Served)
            .GroupBy(oi => oi.MenuItem!.Name)
            .Select(g =>
            {
                var first = g.First();
                var itemId = first.MenuItemId!.Value.ToString();
                var revenue = g.Sum(x =>
                {
                    var unitPrice = x.UnitPrice > 0m ? x.UnitPrice : resolvedUnitPrices.GetValueOrDefault(x.Id, 0m);
                    return x.Quantity * unitPrice;
                });
                return new TopSellingItemDto(
                    g.Key,
                    g.Sum(x => x.Quantity),
                    revenue,
                    itemId
                );
            })
            .OrderByDescending(x => x.QuantitySold)
            .ThenByDescending(x => x.Revenue)
            .Take(10)
            .ToList();
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
