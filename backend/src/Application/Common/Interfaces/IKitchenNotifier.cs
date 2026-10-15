namespace Application.Common.Interfaces;

public interface IKitchenNotifier
{
    Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default);
}
