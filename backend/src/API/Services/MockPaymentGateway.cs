using API.DTOs;
using API.Services.Interfaces;

namespace API.Services;

public class MockPaymentGateway : IPaymentGateway
{
    public string GeneratePaymentUrl(string bookingCode, decimal amount, string description, string? clientIp = null)
    {
        return $"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount={(long)(amount * 100)}&vnp_OrderInfo={Uri.EscapeDataString(description)}&vnp_TxnRef={bookingCode}";
    }

    public Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(amount > 0 && !string.IsNullOrWhiteSpace(transactionId));
    }

    public bool VerifyIpnSignature(VnPayIpnDto ipnDto, IDictionary<string, string>? rawParams = null) => true;
}
