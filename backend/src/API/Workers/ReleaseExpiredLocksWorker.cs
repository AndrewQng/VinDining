using API.Services.Interfaces;

namespace API.Workers;

public class ReleaseExpiredLocksWorker : BackgroundService
{
    private static readonly TimeSpan ScanInterval = TimeSpan.FromSeconds(60);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReleaseExpiredLocksWorker> _logger;

    public ReleaseExpiredLocksWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<ReleaseExpiredLocksWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ReleaseExpiredLocksWorker started (interval={IntervalSeconds}s).", ScanInterval.TotalSeconds);

        using var timer = new PeriodicTimer(ScanInterval);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var lockService = scope.ServiceProvider.GetRequiredService<IExpiredReservationLockService>();
                    await lockService.ReleaseExpiredLocksAsync(DateTime.UtcNow, stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Error while releasing expired reservation locks.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("ReleaseExpiredLocksWorker stopped gracefully.");
        }
    }
}
