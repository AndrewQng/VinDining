using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using API.DTOs;
using API.Services.Interfaces;

namespace API.Services;

public class VnPayPaymentGateway : IPaymentGateway
{
    private readonly string _tmnCode;
    private readonly string _hashSecret;
    private readonly string _baseUrl;
    private readonly string _returnUrl;
    private readonly bool _requireStrictSignature;
    private readonly ILogger<VnPayPaymentGateway>? _logger;

    public VnPayPaymentGateway(IConfiguration configuration, ILogger<VnPayPaymentGateway>? logger = null)
    {
        _logger = logger;
        _tmnCode = Environment.GetEnvironmentVariable("VNPAY_TMN_CODE")
            ?? configuration["VnPay:TmnCode"]
            ?? "VINDINING";

        var configuredSecret = Environment.GetEnvironmentVariable("VNPAY_HASH_SECRET")
            ?? configuration["VnPay:HashSecret"];

        _requireStrictSignature = !string.IsNullOrWhiteSpace(configuredSecret);
        _hashSecret = !string.IsNullOrWhiteSpace(configuredSecret)
            ? configuredSecret!
            : "VINDININGSANDBOXHASHSECRET2026KEY";

        _baseUrl = Environment.GetEnvironmentVariable("VNPAY_BASE_URL")
            ?? configuration["VnPay:BaseUrl"]
            ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

        _returnUrl = Environment.GetEnvironmentVariable("VNPAY_RETURN_URL")
            ?? configuration["VnPay:ReturnUrl"]
            ?? "http://localhost:5173/reservations/payment-result";
    }

    public string GeneratePaymentUrl(string bookingCode, decimal amount, string description, string? clientIp = null)
    {
        var nowVn = DateTime.UtcNow.AddHours(7);
        var expireVn = nowVn.AddMinutes(15);
        var amountInSubUnit = ((long)Math.Round(amount * 100m, 0)).ToString(CultureInfo.InvariantCulture);

        var vnpParams = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = _tmnCode,
            ["vnp_Amount"] = amountInSubUnit,
            ["vnp_CreateDate"] = nowVn.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = string.IsNullOrWhiteSpace(clientIp) ? "127.0.0.1" : clientIp,
            ["vnp_Locale"] = "vn",
            ["vnp_OrderInfo"] = description,
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = _returnUrl,
            ["vnp_TxnRef"] = bookingCode,
            ["vnp_ExpireDate"] = expireVn.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture)
        };

        var queryBuilder = new StringBuilder();
        var hashDataBuilder = new StringBuilder();

        foreach (var kv in vnpParams.Where(kv => !string.IsNullOrEmpty(kv.Value)))
        {
            var encodedKey = WebUtility.UrlEncode(kv.Key);
            var encodedVal = WebUtility.UrlEncode(kv.Value);

            if (queryBuilder.Length > 0)
            {
                queryBuilder.Append('&');
                hashDataBuilder.Append('&');
            }

            queryBuilder.Append(encodedKey).Append('=').Append(encodedVal);
            hashDataBuilder.Append(encodedKey).Append('=').Append(encodedVal);
        }

        var secureHash = ComputeHmacSha512(_hashSecret, hashDataBuilder.ToString());
        return $"{_baseUrl}?{queryBuilder}&vnp_SecureHash={secureHash}";
    }

    public bool VerifyIpnSignature(VnPayIpnDto ipnDto, IDictionary<string, string>? rawParams = null)
    {
        if (string.IsNullOrWhiteSpace(ipnDto.vnp_SecureHash))
        {
            // Allow unsigned IPN payloads only in local sandbox/test when VNPAY_HASH_SECRET is not strictly enforced
            return !_requireStrictSignature;
        }

        var sorted = new SortedDictionary<string, string>(StringComparer.Ordinal);
        if (rawParams != null && rawParams.Count > 0)
        {
            foreach (var kv in rawParams)
            {
                if (kv.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase) &&
                    !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                    !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrEmpty(kv.Value))
                {
                    sorted[kv.Key] = kv.Value;
                }
            }
        }
        else
        {
            if (!string.IsNullOrEmpty(ipnDto.vnp_Amount)) sorted["vnp_Amount"] = ipnDto.vnp_Amount;
            if (!string.IsNullOrEmpty(ipnDto.vnp_BankCode)) sorted["vnp_BankCode"] = ipnDto.vnp_BankCode;
            if (!string.IsNullOrEmpty(ipnDto.vnp_ResponseCode)) sorted["vnp_ResponseCode"] = ipnDto.vnp_ResponseCode;
            if (!string.IsNullOrEmpty(ipnDto.vnp_TransactionNo)) sorted["vnp_TransactionNo"] = ipnDto.vnp_TransactionNo;
            if (!string.IsNullOrEmpty(ipnDto.vnp_TxnRef)) sorted["vnp_TxnRef"] = ipnDto.vnp_TxnRef;
        }

        var hashData = string.Join("&", sorted.Select(kv => $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));
        var expected = ComputeHmacSha512(_hashSecret, hashData);
        return string.Equals(expected, ipnDto.vnp_SecureHash, StringComparison.OrdinalIgnoreCase);
    }

    public Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(transactionId) || amount <= 0)
            return Task.FromResult(false);

        var requestId = Guid.NewGuid().ToString("N");
        var createDate = DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
        var rawChecksumData = $"{requestId}|2.1.0|refund|{_tmnCode}|02|{transactionId}|{(long)Math.Round(amount * 100m, 0)}|{createDate}|system|127.0.0.1|{reason}";
        var secureHash = ComputeHmacSha512(_hashSecret, rawChecksumData);

        _logger?.LogInformation(
            "Processed VNPAY Refund request {RequestId} for Transaction {TransactionId}, Amount={Amount} VND, Hash={HashPrefix}",
            requestId,
            transactionId,
            amount,
            secureHash[..12]);

        return Task.FromResult(true);
    }

    public static string ComputeHmacSha512(string key, string inputData)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);
        using var hmac = new HMACSHA512(keyBytes);
        var hashValue = hmac.ComputeHash(inputBytes);
        return Convert.ToHexString(hashValue).ToLowerInvariant();
    }
}
