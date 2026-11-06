namespace API.Services.Interfaces;

public interface ITableConcurrencyLock
{
    Task<IAsyncDisposable> AcquireAsync(Guid tableId, CancellationToken ct = default);
    Task<IAsyncDisposable> AcquireManyAsync(IEnumerable<Guid> tableIds, CancellationToken ct = default);
}
