using System.Collections.Concurrent;

namespace API.Workers;

public class DiningSurveyWorker : BackgroundService
{
    private static readonly TimeSpan ScanInterval = TimeSpan.FromMinutes(5);
    private readonly ConcurrentDictionary<Guid, DateTime> _sentSurveys = new();
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DiningSurveyWorker> _logger;

    public DiningSurveyWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<DiningSurveyWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(ScanInterval);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await ScanAndSendSurveysAsync(stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Error while dispatching post-dining CSAT surveys.");
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    public async Task<int> ScanAndSendSurveysAsync(CancellationToken ct = default)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;
        var recentCutoff = now.AddHours(-12);

        var recentPaidInvoices = await dbContext.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Reservation)
                    .ThenInclude(r => r!.Guest)
            .AsNoTracking()
            .Where(i => i.IsPaid &&
                        i.CreatedAt >= recentCutoff &&
                        i.Order.ReservationId != null)
            .ToListAsync(ct);

        var sentCount = 0;
        foreach (var invoice in recentPaidInvoices)
        {
            var reservation = invoice.Order.Reservation;
            if (reservation == null) continue;

            var alreadyHasFeedback = await dbContext.Feedbacks
                .AsNoTracking()
                .AnyAsync(f => f.ReservationId == reservation.Id, ct);

            if (alreadyHasFeedback) continue;

            if (_sentSurveys.TryAdd(invoice.Id, now))
            {
                _logger.LogInformation(
                    "Dispatched post-dining CSAT survey link (/feedback/{InvoiceId}) to Guest {Email} for Booking {BookingCode}.",
                    invoice.Id,
                    reservation.Guest?.Email,
                    reservation.BookingCode);
                sentCount++;
            }
        }

        var pruneCutoff = now.AddHours(-24);
        foreach (var kv in _sentSurveys)
        {
            if (kv.Value < pruneCutoff)
            {
                _sentSurveys.TryRemove(kv.Key, out _);
            }
        }

        return sentCount;
    }
}
