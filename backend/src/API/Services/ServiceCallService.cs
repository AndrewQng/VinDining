using System.Collections.Concurrent;

namespace API.Services;

public interface IServiceCallStore
{
    void Add(ServiceCallEntry entry);
    bool TryComplete(Guid id, out ServiceCallEntry? completed);
    List<ServiceCallResponseDto> GetActive();
}

public sealed record ServiceCallEntry(
    Guid Id,
    Guid TableId,
    string TableNumber,
    string RequestType,
    string? Note,
    string Status,
    DateTime CreatedAt
);

public sealed class InMemoryServiceCallStore : IServiceCallStore
{
    private readonly ConcurrentDictionary<Guid, ServiceCallEntry> _entries = new();

    public void Add(ServiceCallEntry entry)
    {
        _entries[entry.Id] = entry;
    }

    public bool TryComplete(Guid id, out ServiceCallEntry? completed)
    {
        if (_entries.TryGetValue(id, out var existing))
        {
            var updated = existing with { Status = "Completed" };
            _entries[id] = updated;
            completed = updated;
            return true;
        }

        completed = null;
        return false;
    }

    public List<ServiceCallResponseDto> GetActive()
    {
        return _entries.Values
            .Where(e => e.Status == "Pending")
            .OrderBy(e => e.CreatedAt)
            .Select(e => new ServiceCallResponseDto(
                e.Id,
                e.TableId,
                e.TableNumber,
                string.IsNullOrWhiteSpace(e.Note) ? e.RequestType : $"{e.RequestType} ({e.Note})",
                e.Status,
                e.CreatedAt))
            .ToList();
    }
}

public class ServiceCallService : IServiceCallService
{
    private static readonly IServiceCallStore DefaultStore = new InMemoryServiceCallStore();

    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier _tableNotifier;
    private readonly IServiceCallStore _store;

    public ServiceCallService(
        IApplicationDbContext context,
        ITableNotifier tableNotifier,
        IServiceCallStore? store = null)
    {
        _context = context;
        _tableNotifier = tableNotifier;
        _store = store ?? DefaultStore;
    }

    public async Task<Guid> CreateServiceCallAsync(Guid tableId, ServiceCallDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.RequestType))
            throw new ArgumentException("Loại yêu cầu hỗ trợ tại bàn không được để trống.");

        var table = await _context.Tables.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tableId, ct);
        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn {tableId}.");

        if (!table.IsActive)
            throw new InvalidOperationException($"Bàn {table.TableNumber} hiện không hoạt động.");

        var entry = new ServiceCallEntry(
            Id: Guid.NewGuid(),
            TableId: table.Id,
            TableNumber: table.TableNumber,
            RequestType: dto.RequestType.Trim(),
            Note: dto.Note?.Trim(),
            Status: "Pending",
            CreatedAt: DateTime.UtcNow
        );

        _store.Add(entry);

        var responseDto = new ServiceCallResponseDto(
            entry.Id,
            entry.TableId,
            entry.TableNumber,
            string.IsNullOrWhiteSpace(entry.Note) ? entry.RequestType : $"{entry.RequestType} ({entry.Note})",
            entry.Status,
            entry.CreatedAt);

        await _tableNotifier.NotifyServiceCallCreatedAsync(responseDto, ct);
        return entry.Id;
    }

    public async Task<bool> CompleteServiceCallAsync(Guid id, CancellationToken ct = default)
    {
        if (!_store.TryComplete(id, out var completed) || completed == null)
            throw new KeyNotFoundException($"Không tìm thấy yêu cầu gọi phục vụ {id}.");

        await _tableNotifier.NotifyServiceCallCompletedAsync(completed.Id, completed.TableId, completed.TableNumber, ct);
        return true;
    }

    public Task<List<ServiceCallResponseDto>> GetActiveServiceCallsAsync(CancellationToken ct = default)
    {
        return Task.FromResult(_store.GetActive());
    }
}
