using API.DTOs;

namespace API.Services.Interfaces;

public interface IPaymentGateway
{
    string GeneratePaymentUrl(string bookingCode, decimal amount, string description, string? clientIp = null);
    Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default);
    bool VerifyIpnSignature(VnPayIpnDto ipnDto, IDictionary<string, string>? rawParams = null) => true;
}
