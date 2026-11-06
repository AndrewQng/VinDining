using System.Collections.Concurrent;
using API.Models.Common;
using API.Services.Interfaces;

namespace API.Services;

public sealed class TableConcurrencyLock : ITableConcurrencyLock
{
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _locks = new();
    private readonly TimeSpan _timeout;

    public TableConcurrencyLock(TimeSpan? timeout = null)
    {
        _timeout = timeout ?? TimeSpan.FromSeconds(5);
    }

    public Task<IAsyncDisposable> AcquireAsync(Guid tableId, CancellationToken ct = default)
        => AcquireManyAsync(new[] { tableId }, ct);

    public async Task<IAsyncDisposable> AcquireManyAsync(IEnumerable<Guid> tableIds, CancellationToken ct = default)
    {
        // Sort distinct IDs deterministically to prevent deadlocks during multi-table operations (Transfer / Merge)
        var orderedIds = tableIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .OrderBy(id => id)
            .ToArray();

        var acquired = new List<SemaphoreSlim>(orderedIds.Length);
        try
        {
            foreach (var id in orderedIds)
            {
                var semaphore = _locks.GetOrAdd(id, _ => new SemaphoreSlim(1, 1));
                if (!await semaphore.WaitAsync(_timeout, ct))
                {
                    throw new ConflictException("Bàn đang được xử lý bởi một giao dịch đồng thời khác. Vui lòng thử lại.");
                }
                acquired.Add(semaphore);
            }

            return new Releaser(acquired);
        }
        catch
        {
            for (int i = acquired.Count - 1; i >= 0; i--)
            {
                acquired[i].Release();
            }
            throw;
        }
    }

    private sealed class Releaser : IAsyncDisposable
    {
        private List<SemaphoreSlim>? _semaphores;

        public Releaser(List<SemaphoreSlim> semaphores)
        {
            _semaphores = semaphores;
        }

        public ValueTask DisposeAsync()
        {
            var list = Interlocked.Exchange(ref _semaphores, null);
            if (list != null)
            {
                for (int i = list.Count - 1; i >= 0; i--)
                {
                    list[i].Release();
                }
            }
            return ValueTask.CompletedTask;
        }
    }
}
