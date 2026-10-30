namespace API.Services.Interfaces;

public interface ITableService
{
    Task<bool> CheckInReservationAsync(Guid id, CheckInDto dto, CancellationToken ct = default);
    Task<Guid> CheckInWalkInAsync(Guid id, WalkInDto dto, CancellationToken ct = default);
    Task<bool> TransferTableAsync(Guid sourceId, TransferTableDto dto, CancellationToken ct = default);
    Task<bool> MergeTablesAsync(MergeTablesDto dto, CancellationToken ct = default);
    Task<List<TableDto>> GetFloorPlanAsync(CancellationToken ct = default);
    Task<TableDto> GetTableByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> UpdateTableStatusAsync(Guid id, UpdateTableStatusDto dto, CancellationToken ct = default);
}
