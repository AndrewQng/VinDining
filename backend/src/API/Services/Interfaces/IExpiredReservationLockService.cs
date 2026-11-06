namespace API.Services.Interfaces;

public interface IExpiredReservationLockService
{
    Task<int> ReleaseExpiredLocksAsync(DateTime? utcNow = null, CancellationToken ct = default);
}
