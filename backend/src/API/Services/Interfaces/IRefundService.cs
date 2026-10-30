namespace API.Services.Interfaces;

public interface IRefundService
{
    Task<bool> OverrideRefundAsync(Guid reservationId, ManualRefundDto dto, CancellationToken ct = default);
    Task<List<RefundRequestDto>> GetRefundRequestsAsync(CancellationToken ct = default);
}
