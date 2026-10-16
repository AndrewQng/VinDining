using API.Hubs;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

public class KitchenNotifier : IKitchenNotifier
{
    private readonly IHubContext<KitchenHub> _kitchenHub;

    public KitchenNotifier(IHubContext<KitchenHub> kitchenHub)
    {
        _kitchenHub = kitchenHub;
    }

    public async Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "ReceiveNewOrder",
            new
            {
                OrderId = orderId,
                TableNumber = tableNumber,
                CreatedAt = DateTime.UtcNow
            },
            cancellationToken);
    }

    public async Task NotifyCourseFiredAsync(Guid orderId, string tableNumber, Domain.Enums.CourseType courseType, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "CourseFired",
            new
            {
                OrderId = orderId,
                TableNumber = tableNumber,
                CourseType = courseType.ToString(),
                FiredAt = DateTime.UtcNow
            },
            cancellationToken);
    }

    public async Task NotifyItemRemakeAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "ItemRemake",
            new
            {
                OrderId = orderId,
                TableNumber = tableNumber,
                OrderItemId = orderItemId,
                MenuItemName = menuItemName,
                Reason = reason,
                IsRush = true,
                RemakeAt = DateTime.UtcNow
            },
            cancellationToken);
    }

    public async Task NotifyItemServedAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default)
    {
        await _kitchenHub.Clients.All.SendAsync(
            "ItemServed",
            new
            {
                OrderId = orderId,
                TableNumber = tableNumber,
                OrderItemId = orderItemId,
                MenuItemName = menuItemName,
                ServedById = servedById,
                ServedAt = DateTime.UtcNow
            },
            cancellationToken);
    }
}
