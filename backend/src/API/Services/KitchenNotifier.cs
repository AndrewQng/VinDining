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
}
