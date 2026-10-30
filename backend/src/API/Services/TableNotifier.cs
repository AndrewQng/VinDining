using API.Hubs;
using API.Services.Interfaces;
using API.Models.Enums;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

public class TableNotifier : ITableNotifier
{
    private readonly IHubContext<TableHub> _tableHub;

    public TableNotifier(IHubContext<TableHub> tableHub)
    {
        _tableHub = tableHub;
    }

    public async Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "TableStatusChanged",
            new
            {
                TableId = tableId,
                TableNumber = tableNumber,
                Status = newStatus.ToString(),
                UpdatedAt = DateTime.UtcNow
            },
            cancellationToken);
    }
}
