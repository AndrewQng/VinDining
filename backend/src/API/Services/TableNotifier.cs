using API.DTOs;
using API.Hubs;
using API.Models.Enums;
using API.Services.Interfaces;
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

    public async Task NotifyFloorPlanUpdatedAsync(int updatedCount, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "FloorPlanUpdated",
            new
            {
                UpdatedCount = updatedCount,
                UpdatedAt = DateTime.UtcNow
            },
            cancellationToken);
    }

    public async Task NotifyServiceCallCreatedAsync(ServiceCallResponseDto serviceCall, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync("ServiceCallCreated", serviceCall, cancellationToken);
    }

    public async Task NotifyServiceCallCompletedAsync(Guid serviceCallId, Guid tableId, string tableNumber, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "ServiceCallCompleted",
            new
            {
                Id = serviceCallId,
                TableId = tableId,
                TableNumber = tableNumber,
                CompletedAt = DateTime.UtcNow
            },
            cancellationToken);
    }

    public async Task NotifyCheckoutRequestedAsync(Guid tableId, string tableNumber, Guid orderId, decimal estimatedSubtotal = 0m, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "CheckoutRequested",
            new
            {
                TableId = tableId,
                TableNumber = tableNumber,
                OrderId = orderId,
                EstimatedSubtotal = estimatedSubtotal,
                RequestedAt = DateTime.UtcNow
            },
            cancellationToken);
    }
}
