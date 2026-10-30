namespace API.Services.Interfaces;

public interface IPaymentGateway
{
    string GeneratePaymentUrl(string bookingCode, decimal amount, string description);
    Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default);
}
