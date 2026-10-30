namespace API.Services;

public class ServiceCallService : IServiceCallService
{
    private readonly IApplicationDbContext _context;
    private readonly ITableNotifier _tableNotifier;

    public ServiceCallService(IApplicationDbContext context, ITableNotifier tableNotifier)
    {
        _context = context;
        _tableNotifier = tableNotifier;
    }

    public async Task<Guid> CreateServiceCallAsync(Guid tableId, ServiceCallDto dto, CancellationToken ct = default)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == tableId, ct);
        if (table == null) throw new KeyNotFoundException($"Không tìm thấy bàn {tableId}.");

        await _tableNotifier.NotifyTableStatusChangedAsync(table.Id, table.TableNumber, table.Status, ct);
        return Guid.NewGuid();
    }

    public Task<bool> CompleteServiceCallAsync(Guid id, CancellationToken ct = default)
    {
        return Task.FromResult(true);
    }

    public Task<List<ServiceCallResponseDto>> GetActiveServiceCallsAsync(CancellationToken ct = default)
    {
        return Task.FromResult(new List<ServiceCallResponseDto>());
    }
}
