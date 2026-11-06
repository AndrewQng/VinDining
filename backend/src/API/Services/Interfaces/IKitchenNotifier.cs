using API.Models.Enums;

namespace API.Services.Interfaces;

public interface IKitchenNotifier
{
    Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default);
    Task NotifyCourseFiredAsync(Guid orderId, string tableNumber, CourseType courseType, CancellationToken cancellationToken = default);
    Task NotifyItemRemakeAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default);
    Task NotifyItemServedAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default);

    Task NotifyItemCancelledAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    Task NotifySlaAlertAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string slaStatus, int elapsedSeconds, int prepTimeMinutes, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
