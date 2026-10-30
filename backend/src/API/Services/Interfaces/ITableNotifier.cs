using API.Models.Enums;

namespace API.Services.Interfaces;

public interface ITableNotifier
{
    Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default);
}
