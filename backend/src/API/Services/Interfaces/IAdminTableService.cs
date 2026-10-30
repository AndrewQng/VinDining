namespace API.Services.Interfaces;

public interface IAdminTableService
{
    Task<int> UpdateFloorPlanLayoutAsync(UpdateFloorPlanDto dto, CancellationToken ct = default);
    Task<Guid> CreateTableAsync(CreateTableDto dto, CancellationToken ct = default);
    Task<bool> DeleteTableAsync(Guid id, CancellationToken ct = default);
}
