using API.Models.Enums;

namespace API.Services.Interfaces;

public interface IKitchenNotifier
{
    Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default);
    Task NotifyNewOrderAsync(Guid orderId, Guid tableId, string tableNumber, CancellationToken cancellationToken = default)
        => NotifyNewOrderAsync(orderId, tableNumber, cancellationToken);

    Task NotifyCourseFiredAsync(Guid orderId, string tableNumber, CourseType courseType, CancellationToken cancellationToken = default);
    Task NotifyCourseFiredAsync(Guid orderId, Guid tableId, string tableNumber, CourseType courseType, bool isPriority = false, CancellationToken cancellationToken = default)
        => NotifyCourseFiredAsync(orderId, tableNumber, courseType, cancellationToken);

    Task NotifyItemRemakeAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default);
    Task NotifyItemRemakeAsync(Guid orderId, Guid tableId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        => NotifyItemRemakeAsync(orderId, tableNumber, orderItemId, menuItemName, reason, cancellationToken);

    Task NotifyItemServedAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default);
    Task NotifyItemServedAsync(Guid orderId, Guid tableId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default)
        => NotifyItemServedAsync(orderId, tableNumber, orderItemId, menuItemName, servedById, cancellationToken);

    Task NotifyItemCancelledAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
    Task NotifyItemCancelledAsync(Guid orderId, Guid tableId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        => NotifyItemCancelledAsync(orderId, tableNumber, orderItemId, menuItemName, reason, cancellationToken);

    Task NotifySlaAlertAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string slaStatus, int elapsedSeconds, int prepTimeMinutes, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
