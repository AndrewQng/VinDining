using System.Collections.Concurrent;

namespace API.Workers;

public class ReservationReminderWorker : BackgroundService
{
    private static readonly TimeSpan ScanInterval = TimeSpan.FromMinutes(15);
    private readonly ConcurrentDictionary<Guid, DateTime> _remindedReservations = new();
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationReminderWorker> _logger;

    public ReservationReminderWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationReminderWorker> logger)
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
                    await ScanAndSendRemindersAsync(stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Error while dispatching upcoming reservation reminders.");
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    public async Task<int> ScanAndSendRemindersAsync(CancellationToken ct = default)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;
        var windowEnd = now.AddHours(2);

        var upcoming = await dbContext.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .AsNoTracking()
            .Where(r => r.Status == ReservationStatus.Confirmed &&
                        r.ReservationTime > now &&
                        r.ReservationTime <= windowEnd)
            .ToListAsync(ct);

        var sentCount = 0;
        foreach (var res in upcoming)
        {
            if (_remindedReservations.TryAdd(res.Id, now))
            {
                _logger.LogInformation(
                    "Dispatched 2-hour dining reminder for Booking {BookingCode} to Guest {Email} / {Phone} (Table {TableNumber} at {Time:u}).",
                    res.BookingCode,
                    res.Guest?.Email,
                    res.Guest?.PhoneNumber,
                    res.Table?.TableNumber,
                    res.ReservationTime);
                sentCount++;
            }
        }

        // Prune entries older than 24h to keep memory bounded
        var pruneCutoff = now.AddHours(-24);
        foreach (var kv in _remindedReservations)
        {
            if (kv.Value < pruneCutoff)
            {
                _remindedReservations.TryRemove(kv.Key, out _);
            }
        }

        return sentCount;
    }
}
