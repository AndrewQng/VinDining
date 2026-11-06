using System.Collections.Concurrent;

namespace API.Workers;

public interface IOrderSlaMonitorService
{
    Task<int> ScanSlaViolationsAsync(DateTime? utcNow = null, CancellationToken ct = default);
}

public class OrderSlaMonitorService : IOrderSlaMonitorService
{
    private static readonly ConcurrentDictionary<Guid, string> SharedNotifiedLevels = new();

    private readonly ConcurrentDictionary<Guid, string> _notifiedLevels;
    private readonly IApplicationDbContext _context;
    private readonly IKitchenNotifier _kitchenNotifier;

    public OrderSlaMonitorService(
        IApplicationDbContext context,
        IKitchenNotifier kitchenNotifier,
        ConcurrentDictionary<Guid, string>? stateStore = null)
    {
        _context = context;
        _kitchenNotifier = kitchenNotifier;
        _notifiedLevels = stateStore ?? SharedNotifiedLevels;
    }

    public async Task<int> ScanSlaViolationsAsync(DateTime? utcNow = null, CancellationToken ct = default)
    {
        var now = utcNow ?? DateTime.UtcNow;

        var preparingItems = await _context.OrderItems
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .Include(oi => oi.MenuItem)
            .AsNoTracking()
            .Where(oi => oi.Status == OrderItemStatus.Preparing &&
                         oi.FiredAt != null &&
                         oi.MenuItemId != null &&
                         oi.Order.Status == OrderStatus.Processing)
            .ToListAsync(ct);

        var activeIds = preparingItems.Select(i => i.Id).ToHashSet();
        foreach (var staleId in _notifiedLevels.Keys.Where(k => !activeIds.Contains(k)).ToList())
        {
            _notifiedLevels.TryRemove(staleId, out _);
        }

        var alertCount = 0;
        foreach (var item in preparingItems)
        {
            var prepMinutes = Math.Max(1, item.MenuItem?.PrepTimeMinutes ?? 15);
            var elapsedSeconds = Math.Max(0, (int)(now - item.FiredAt!.Value).TotalSeconds);
            var ratio = elapsedSeconds / (prepMinutes * 60.0);

            string? level = ratio >= 1.0 ? "Overdue" : ratio >= 0.8 ? "Warning" : null;
            if (level == null)
                continue;

            if (_notifiedLevels.TryGetValue(item.Id, out var prevLevel) && prevLevel == level)
                continue;

            _notifiedLevels[item.Id] = level;
            await _kitchenNotifier.NotifySlaAlertAsync(
                item.OrderId,
                item.Order?.Table?.TableNumber ?? "N/A",
                item.Id,
                item.MenuItem?.Name ?? "Món ăn",
                level,
                elapsedSeconds,
                prepMinutes,
                ct);

            alertCount++;
        }

        return alertCount;
    }
}

public class OrderSlaMonitorWorker : BackgroundService
{
    private static readonly TimeSpan ScanInterval = TimeSpan.FromSeconds(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderSlaMonitorWorker> _logger;

    public OrderSlaMonitorWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderSlaMonitorWorker> logger)
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
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var slaService = scope.ServiceProvider.GetRequiredService<IOrderSlaMonitorService>();
                    await slaService.ScanSlaViolationsAsync(DateTime.UtcNow, stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Error while scanning kitchen Prep SLA timers.");
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }
}
