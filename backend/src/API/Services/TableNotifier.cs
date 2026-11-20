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
        var frontendStatus = newStatus == TableStatus.LockedForPayment ? "Locked" : newStatus.ToString();
        await _tableHub.Clients.All.SendAsync(
            "table:status-changed",
            new { tableId = tableId.ToString(), tableNumber, status = frontendStatus },
            cancellationToken);
    }

    public async Task NotifyFloorPlanUpdatedAsync(int updatedCount, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "table:status-changed",
            new { tableId = string.Empty, tableNumber = string.Empty, status = "Available" },
            cancellationToken);
    }

    public async Task NotifyServiceCallCreatedAsync(ServiceCallResponseDto serviceCall, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "service-request:created",
            new
            {
                requestId = serviceCall.Id.ToString(),
                tableId = serviceCall.TableId.ToString(),
                tableNumber = serviceCall.TableNumber,
                requestType = serviceCall.RequestType
            },
            cancellationToken);
    }

    public async Task NotifyServiceCallCompletedAsync(Guid serviceCallId, Guid tableId, string tableNumber, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "service-request:completed",
            new
            {
                requestId = serviceCallId.ToString(),
                tableId = tableId.ToString()
            },
            cancellationToken);
    }

    public async Task NotifyCheckoutRequestedAsync(Guid tableId, string tableNumber, Guid orderId, decimal estimatedSubtotal = 0m, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "checkout:requested",
            new
            {
                tableId = tableId.ToString(),
                tableNumber
            },
            cancellationToken);
    }

    public async Task NotifyInvoiceSettledAsync(Guid invoiceId, Guid tableId, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "invoice:settled",
            new
            {
                invoiceId = invoiceId.ToString(),
                tableId = tableId.ToString()
            },
            cancellationToken);
    }

    public async Task NotifyMenuUpdatedAsync(Guid menuItemId, bool isAvailable, CancellationToken cancellationToken = default)
    {
        await _tableHub.Clients.All.SendAsync(
            "menu:updated",
            new
            {
                menuItemId = menuItemId.ToString(),
                status = isAvailable ? "Available" : "SoldOut"
            },
            cancellationToken);
    }
}
