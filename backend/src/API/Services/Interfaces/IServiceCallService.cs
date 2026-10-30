namespace API.Services.Interfaces;

public interface IServiceCallService
{
    Task<Guid> CreateServiceCallAsync(Guid tableId, ServiceCallDto dto, CancellationToken ct = default);
    Task<bool> CompleteServiceCallAsync(Guid id, CancellationToken ct = default);
    Task<List<ServiceCallResponseDto>> GetActiveServiceCallsAsync(CancellationToken ct = default);
}
