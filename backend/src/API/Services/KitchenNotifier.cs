using API.Hubs;
using API.Models.Enums;
using API.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

public class KitchenNotifier : IKitchenNotifier
{
    private readonly IHubContext<KitchenHub> _kitchenHub;

    public KitchenNotifier(IHubContext<KitchenHub> kitchenHub)
    {
        _kitchenHub = kitchenHub;
    }

    public Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default)
        => NotifyNewOrderAsync(orderId, Guid.Empty, tableNumber, cancellationToken);

    public async Task NotifyNewOrderAsync(Guid orderId, Guid tableId, string tableNumber, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "order:updated",
            new
            {
                orderId,
                tableId = tableId == Guid.Empty ? string.Empty : tableId.ToString(),
                tableNumber
            },
            cancellationToken);
    }

    public Task NotifyCourseFiredAsync(Guid orderId, string tableNumber, CourseType courseType, CancellationToken cancellationToken = default)
        => NotifyCourseFiredAsync(orderId, Guid.Empty, tableNumber, courseType, false, cancellationToken);

    public async Task NotifyCourseFiredAsync(Guid orderId, Guid tableId, string tableNumber, CourseType courseType, bool isPriority = false, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "course:activated",
            new
            {
                orderId,
                tableId = tableId == Guid.Empty ? string.Empty : tableId.ToString(),
                courseType = courseType.ToString(),
                isPriority
            },
            cancellationToken);
    }

    public Task NotifyItemRemakeAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        => NotifyItemRemakeAsync(orderId, Guid.Empty, tableNumber, orderItemId, menuItemName, reason, cancellationToken);

    public async Task NotifyItemRemakeAsync(Guid orderId, Guid tableId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "item:remake-requested",
            new
            {
                orderId,
                orderItemId,
                tableId = tableId == Guid.Empty ? string.Empty : tableId.ToString(),
                itemName = menuItemName
            },
            cancellationToken);
    }

    public Task NotifyItemServedAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default)
        => NotifyItemServedAsync(orderId, Guid.Empty, tableNumber, orderItemId, menuItemName, servedById, cancellationToken);

    public async Task NotifyItemServedAsync(Guid orderId, Guid tableId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "item:served",
            new
            {
                orderId,
                orderItemId,
                tableId = tableId == Guid.Empty ? string.Empty : tableId.ToString(),
                tableNumber,
                itemName = menuItemName
            },
            cancellationToken);
    }

    public Task NotifyItemCancelledAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        => NotifyItemCancelledAsync(orderId, Guid.Empty, tableNumber, orderItemId, menuItemName, reason, cancellationToken);

    public async Task NotifyItemCancelledAsync(Guid orderId, Guid tableId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "order:updated",
            new
            {
                orderId,
                tableId = tableId == Guid.Empty ? string.Empty : tableId.ToString(),
                tableNumber
            },
            cancellationToken);
    }

    public async Task NotifySlaAlertAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string slaStatus, int elapsedSeconds, int prepTimeMinutes, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "sla:alert",
            new
            {
                overdueCount = string.Equals(slaStatus, "Overdue", StringComparison.OrdinalIgnoreCase) ? 1 : 0,
                warningCount = string.Equals(slaStatus, "Warning", StringComparison.OrdinalIgnoreCase) ? 1 : 0
            },
            cancellationToken);
    }
}
