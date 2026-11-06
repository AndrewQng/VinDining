using Microsoft.AspNetCore.SignalR;

namespace API.Hubs;

public class KitchenHub : Hub
{
    public async Task JoinKitchenGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "kds:kitchen");
    }

    public async Task JoinExpediterGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "kds:expediter");
    }

    public async Task LeaveKitchenGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "kds:kitchen");
    }
}
