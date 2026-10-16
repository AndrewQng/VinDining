using Domain.Enums;

namespace Application.Common.Interfaces;

public interface ITableNotifier
{
    Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default);
}
