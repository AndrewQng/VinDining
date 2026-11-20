namespace API.Services;

public class ExpiredReservationLockService : IExpiredReservationLockService
{
    public const int LockExpiryMinutes = 17;

    private static readonly ITableConcurrencyLock DefaultTableLock = new TableConcurrencyLock();

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
        _tableLock = tableLock ?? DefaultTableLock;
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

        var tableIds = expiredReservations.Select(r => r.TableId).Distinct().ToList();
        await using var lockHandle = await _tableLock.AcquireManyAsync(tableIds, ct);

        var activeExpired = expiredReservations
            .Where(r => r.Status == ReservationStatus.Pending)
            .ToList();

        if (activeExpired.Count == 0)
            return 0;

        var excludedIds = activeExpired.Select(r => r.Id).ToHashSet();
        var affectedTables = new Dictionary<Guid, Table>();

        foreach (var reservation in activeExpired)
        {
            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancelledAt = now;
            reservation.CancelledReason = $"Tự động hủy do quá thời hạn thanh toán tiền cọc {LockExpiryMinutes} phút.";

            if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Pending)
            {
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;
            }

            if (reservation.Table != null &&
                (reservation.Table.Status == TableStatus.LockedForPayment || reservation.Table.Status == TableStatus.Reserved))
            {
                affectedTables.TryAdd(reservation.Table.Id, reservation.Table);
            }
        }

        var changedTables = new List<(Guid TableId, string TableNumber, TableStatus Status)>();
        foreach (var table in affectedTables.Values)
        {
            var nextStatus = await ReservationService.ResolveSafeTableStatusAfterReleaseAsync(
                _context,
                table,
                excludedIds,
                now,
                ct);

            if (table.Status != nextStatus)
            {
                table.Status = nextStatus;
                changedTables.Add((table.Id, table.TableNumber, table.Status));
            }
        }

        await _context.SaveChangesAsync(ct);

        foreach (var table in changedTables)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(table.TableId, table.TableNumber, table.Status, ct);
        }

        _logger?.LogInformation("Released {Count} expired pending reservations older than {Minutes} minutes.", activeExpired.Count, LockExpiryMinutes);

        return activeExpired.Count;
    }
}
