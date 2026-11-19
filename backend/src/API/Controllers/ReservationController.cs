using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[Route("api/reservations")]
[Route("api/reservation")]
public class ReservationController : ApiControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly IPaymentGateway _paymentGateway;

    public ReservationController(IReservationService reservationService, IPaymentGateway paymentGateway)
    {
        _reservationService = reservationService;
        _paymentGateway = paymentGateway;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateReservationAsync([FromBody] CreateReservationDto dto, CancellationToken ct)
    {
        var result = await _reservationService.CreateReservationAsync(dto, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("/api/payments/vnpay-ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> ProcessVnPayIpnPostAsync(CancellationToken ct)
    {
        Dictionary<string, string> rawParams;
        VnPayIpnDto paramsDto;

        if (Request.HasFormContentType)
        {
            rawParams = Request.Form.ToDictionary(k => k.Key, v => v.Value.ToString());
            paramsDto = new VnPayIpnDto(
                rawParams.GetValueOrDefault("vnp_TxnRef"),
                rawParams.GetValueOrDefault("vnp_Amount"),
                rawParams.GetValueOrDefault("vnp_ResponseCode"),
                rawParams.GetValueOrDefault("vnp_TransactionNo"),
                rawParams.GetValueOrDefault("vnp_BankCode"),
                rawParams.GetValueOrDefault("vnp_SecureHash"));
        }
        else if (Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true)
        {
            var jsonDto = await JsonSerializer.DeserializeAsync<VnPayIpnDto>(
                Request.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                ct) ?? new VnPayIpnDto();

            var txnRef = !string.IsNullOrWhiteSpace(jsonDto.vnp_TxnRef) ? jsonDto.vnp_TxnRef : jsonDto.BookingCode;
            var rspCode = !string.IsNullOrWhiteSpace(jsonDto.vnp_ResponseCode) ? jsonDto.vnp_ResponseCode : jsonDto.ResponseCode;
            var txnNo = !string.IsNullOrWhiteSpace(jsonDto.vnp_TransactionNo) ? jsonDto.vnp_TransactionNo : jsonDto.TransactionId;

            rawParams = new Dictionary<string, string>();
            if (!string.IsNullOrWhiteSpace(txnRef)) rawParams["vnp_TxnRef"] = txnRef!;
            if (!string.IsNullOrWhiteSpace(jsonDto.vnp_Amount)) rawParams["vnp_Amount"] = jsonDto.vnp_Amount!;
            if (!string.IsNullOrWhiteSpace(rspCode)) rawParams["vnp_ResponseCode"] = rspCode!;
            if (!string.IsNullOrWhiteSpace(txnNo)) rawParams["vnp_TransactionNo"] = txnNo!;

            paramsDto = jsonDto with
            {
                vnp_TxnRef = txnRef,
                vnp_ResponseCode = rspCode,
                vnp_TransactionNo = txnNo
            };
        }
        else
        {
            rawParams = Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
            paramsDto = new VnPayIpnDto(
                rawParams.GetValueOrDefault("vnp_TxnRef"),
                rawParams.GetValueOrDefault("vnp_Amount"),
                rawParams.GetValueOrDefault("vnp_ResponseCode"),
                rawParams.GetValueOrDefault("vnp_TransactionNo"),
                rawParams.GetValueOrDefault("vnp_BankCode"),
                rawParams.GetValueOrDefault("vnp_SecureHash"));
        }

        if (!_paymentGateway.VerifyIpnSignature(paramsDto, rawParams))
        {
            return Ok(new { RspCode = "97", Message = "Invalid Checksum", Success = false });
        }

        var detailed = await _reservationService.ProcessVnPayIpnDetailedAsync(paramsDto, rawParams, ct);
        ReservationDetailDto? reservation = null;
        if (!string.IsNullOrWhiteSpace(paramsDto.vnp_TxnRef))
        {
            try
            {
                reservation = await _reservationService.GetReservationByCodeAsync(paramsDto.vnp_TxnRef!, ct);
            }
            catch
            {
                // Ignore lookup error if booking code does not exist
            }
        }

        return Ok(new
        {
            RspCode = detailed.RspCode,
            Message = detailed.Message,
            Success = detailed.Success,
            IsAutoRefunded = detailed.IsAutoRefunded,
            reservation
        });
    }

    [HttpGet("/api/payments/vnpay-ipn")]
    [HttpGet("/api/payments/vnpay-return")]
    [AllowAnonymous]
    public async Task<IActionResult> ProcessVnPayQueryCallbackAsync([FromQuery] VnPayIpnDto paramsDto, CancellationToken ct)
    {
        var rawParams = Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
        if (!_paymentGateway.VerifyIpnSignature(paramsDto, rawParams))
        {
            return BadRequest(new { RspCode = "97", Message = "Invalid Checksum", Success = false });
        }

        var detailed = await _reservationService.ProcessVnPayIpnDetailedAsync(paramsDto, rawParams, ct);
        return Ok(new
        {
            RspCode = detailed.RspCode,
            Message = detailed.Message,
            BookingCode = paramsDto.vnp_TxnRef,
            IsPaid = detailed.IsPaid,
            IsAutoRefunded = detailed.IsAutoRefunded,
            Success = detailed.Success
        });
    }

    [HttpPost("confirm-deposit")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmDepositAsync([FromBody] ConfirmDepositDto dto, CancellationToken ct)
    {
        var result = await _reservationService.ConfirmDepositAsync(dto, ct);
        return Ok(new { success = result, message = "Đã xác nhận thanh toán tiền cọc thành công." });
    }

    [HttpPost("cancel")]
    [AllowAnonymous]
    public async Task<IActionResult> CancelReservationAsync([FromBody] CancelReservationDto dto, CancellationToken ct)
    {
        var result = await _reservationService.CancelReservationAsync(dto, ct);
        return Ok(result);
    }

    [HttpPatch("{code}/cancel")]
    [AllowAnonymous]
    public async Task<IActionResult> CancelReservationByCodeAsync(string code, [FromBody] CancelReservationBodyDto? body, CancellationToken ct)
    {
        var dto = new CancelReservationDto(
            code,
            body?.Reason ?? "Khách hàng yêu cầu hủy",
            body?.PhoneNumber);
        var result = await _reservationService.CancelReservationAsync(dto, ct);
        return Ok(result);
    }

    [HttpPost("{code}/no-show")]
    [Authorize(Roles = "Waitstaff,Expediter,Cashier,Admin,Manager")]
    public async Task<IActionResult> MarkNoShowAsync(string code, [FromBody] NoShowReservationDto? dto, CancellationToken ct)
    {
        var result = await _reservationService.MarkNoShowAsync(code, dto?.Reason, ct);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Waitstaff,Expediter,Cashier,Admin,Manager")]
    public async Task<IActionResult> GetReservationsAsync(
        [FromQuery] DateTime? date = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        ReservationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            var raw = status.Trim();
            if (Enum.TryParse<ReservationStatus>(raw, ignoreCase: true, out var direct))
                parsedStatus = direct;
            else if (string.Equals(raw, "PendingDeposit", StringComparison.OrdinalIgnoreCase))
                parsedStatus = ReservationStatus.Pending;
            else if (string.Equals(raw, "Reserved", StringComparison.OrdinalIgnoreCase))
                parsedStatus = ReservationStatus.Confirmed;
            else if (raw.StartsWith("Cancelled", StringComparison.OrdinalIgnoreCase) ||
                     raw.StartsWith("Expired", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(raw, "RefundRejected", StringComparison.OrdinalIgnoreCase))
                parsedStatus = ReservationStatus.Cancelled;
        }

        var result = await _reservationService.GetReservationsAsync(date, parsedStatus, search, ct);
        return Ok(result);
    }

    [HttpGet("{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReservationByCodeAsync(
        string code,
        [FromQuery] string? phoneNumber = null,
        [FromQuery] string? phone = null,
        CancellationToken ct = default)
    {
        var effectivePhone = !string.IsNullOrWhiteSpace(phoneNumber) ? phoneNumber : phone;
        var result = await _reservationService.GetReservationByCodeAsync(code, effectivePhone, ct);
        return Ok(result);
    }

    [HttpGet("available-slots")]
    [HttpGet("available-tables")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableTimeSlotsAsync(
        [FromQuery] DateTime? reservationTime = null,
        [FromQuery] string? date = null,
        [FromQuery] int partySize = 2,
        [FromQuery] TableZone? zone = null,
        CancellationToken ct = default)
    {
        if (!reservationTime.HasValue && !string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
        {
            var slotGroups = await _reservationService.GetAvailableSlotGroupsAsync(parsedDate, partySize, zone, ct);
            return Ok(slotGroups);
        }

        var result = await _reservationService.GetAvailableTimeSlotsAsync(reservationTime ?? DateTime.UtcNow, partySize, zone, ct);
        return Ok(result);
    }
}
