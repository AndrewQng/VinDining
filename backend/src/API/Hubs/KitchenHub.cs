using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs;

// We can add [Authorize(Roles = "Expediter,Manager")] later
public class KitchenHub : Hub
{
    // Backend triggers this when Waitstaff submits order: NotifyNewOrder(OrderDto order)
    // Expediter triggers this when marking as served: MarkDishAsServed(Guid orderItemId)
}
