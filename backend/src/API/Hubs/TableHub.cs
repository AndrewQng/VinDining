using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs;

// We can add [Authorize(Roles = "Waitstaff,Manager")] later when auth is fully integrated for the clients
public class TableHub : Hub
{
    // Clients can call this, or the backend can broadcast to this hub
    // SendTableStatusUpdate(Guid tableId, TableStatus newStatus)
}
