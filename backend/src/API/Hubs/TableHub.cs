using Microsoft.AspNetCore.SignalR;

namespace API.Hubs;

public class TableHub : Hub
{
    public async Task JoinZoneGroup(string zone)
    {
        if (!string.IsNullOrWhiteSpace(zone))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"zone:{zone.Trim()}");
        }
    }

    public async Task LeaveZoneGroup(string zone)
    {
        if (!string.IsNullOrWhiteSpace(zone))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"zone:{zone.Trim()}");
        }
    }

    public async Task JoinRoleGroup(string role)
    {
        if (!string.IsNullOrWhiteSpace(role))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role:{role.Trim()}");
        }
    }
}
