namespace API.Services;

public class ExpiredReservationLockService : IExpiredReservationLockService
{
    public const int LockExpiryMinutes = 17;

    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier _tableNotifier;
    private readonly ITableConcurrencyLock _tableLock;
    private readonly ILogger<ExpiredReservationLockService>? _logger;

    public ExpiredReservationLockService(
        IApplicationDbContext context,
        ITableNotifier tableNotifier,
        ITableConcurrencyLock? tableLock = null,
        ILogger<ExpiredReservationLockService>? logger = null)
    {
        _context = context;
        _tableNotifier = tableNotifier;
        _tableLock = tableLock ?? new TableConcurrencyLock();
        _logger = logger;
    }

    public async Task<int> ReleaseExpiredLocksAsync(DateTime? utcNow = null, CancellationToken ct = default)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var cutoff = now.AddMinutes(-LockExpiryMinutes);

        var expiredReservations = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .Where(r => r.Status == ReservationStatus.Pending && r.CreatedAt <= cutoff)
            .ToListAsync(ct);

        if (expiredReservations.Count == 0)
            return 0;

        var releasedCount = 0;
        var tableIds = expiredReservations.Select(r => r.TableId).Distinct().ToList();

        await using var lockHandle = await _tableLock.AcquireManyAsync(tableIds, ct);

        var releasedTables = new List<(Guid TableId, string TableNumber, TableStatus Status)>();

        foreach (var reservation in expiredReservations)
        {
            if (reservation.Status != ReservationStatus.Pending)
                continue;

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt = now;
            reservation.CancelledReason = $"Tự động hủy do quá thời hạn thanh toán tiền cọc {LockExpiryMinutes} phút.";

            if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Pending)
            {
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;
            }

            if (reservation.Table != null && reservation.Table.Status == TableStatus.LockedForPayment)
            {
                reservation.Table.Status = TableStatus.Available;
                releasedTables.Add((reservation.Table.Id, reservation.Table.TableNumber, reservation.Table.Status));
            }

            releasedCount++;
        }

        if (releasedCount > 0)
        {
            await _context.SaveChangesAsync(ct);

            foreach (var table in releasedTables.DistinctBy(t => t.TableId))
            {
                await _tableNotifier.NotifyTableStatusChangedAsync(table.TableId, table.TableNumber, table.Status, ct);
            }

            _logger?.LogInformation("Released {Count} expired pending reservations older than {Minutes} minutes.", releasedCount, LockExpiryMinutes);
        }

        return releasedCount;
    }
}
