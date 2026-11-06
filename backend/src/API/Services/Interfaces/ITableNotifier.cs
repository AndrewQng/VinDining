using API.DTOs;
using API.Models.Enums;

namespace API.Services.Interfaces;

public interface ITableNotifier
{
    Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default);

    Task NotifyFloorPlanUpdatedAsync(int updatedCount, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    Task NotifyServiceCallCreatedAsync(ServiceCallResponseDto serviceCall, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    Task NotifyServiceCallCompletedAsync(Guid serviceCallId, Guid tableId, string tableNumber, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    Task NotifyCheckoutRequestedAsync(Guid tableId, string tableNumber, Guid orderId, decimal estimatedSubtotal = 0m, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
