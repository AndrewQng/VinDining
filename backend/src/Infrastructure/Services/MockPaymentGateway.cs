using Application.Common.Interfaces;

namespace Infrastructure.Services;

public class MockPaymentGateway : IPaymentGateway
{
    public string GeneratePaymentUrl(string bookingCode, decimal amount, string description)
    {
        return $"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount={amount * 100}&vnp_OrderInfo={Uri.EscapeDataString(description)}&vnp_TxnRef={bookingCode}";
    }

    public Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }
}
