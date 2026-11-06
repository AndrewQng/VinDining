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
    public async Task<IActionResult> ProcessVnPayIpnPostAsync([FromForm] VnPayIpnDto paramsDto, CancellationToken ct)
    {
        var rawParams = Request.HasFormContentType
            ? Request.Form.ToDictionary(k => k.Key, v => v.Value.ToString())
            : Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());

        if (!_paymentGateway.VerifyIpnSignature(paramsDto, rawParams))
        {
            return Ok(new { RspCode = "97", Message = "Invalid Checksum", Success = false });
        }

        var result = await _reservationService.ProcessVnPayIpnAsync(paramsDto, rawParams, ct);
        if (!result)
        {
            return Ok(new { RspCode = "01", Message = "Order not found", Success = false });
        }

        return Ok(new { RspCode = "00", Message = "Confirm Success", Success = true });
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

        var result = await _reservationService.ProcessVnPayIpnAsync(paramsDto, rawParams, ct);
        return Ok(new
        {
            RspCode = result ? "00" : "01",
            Message = result ? "Confirm Success" : "Order not found",
            BookingCode = paramsDto.vnp_TxnRef,
            IsPaid = paramsDto.vnp_ResponseCode == "00" && result,
            Success = result
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
        var dto = new CancelReservationDto(code, body?.Reason ?? "Khách hàng yêu cầu hủy");
        var result = await _reservationService.CancelReservationAsync(dto, ct);
        return Ok(result);
    }

    [HttpPost("{code}/no-show")]
    [Authorize(Roles = "Waitstaff,Expediter,Admin,Manager")]
    public async Task<IActionResult> MarkNoShowAsync(string code, [FromBody] NoShowReservationDto? dto, CancellationToken ct)
    {
        var result = await _reservationService.MarkNoShowAsync(code, dto?.Reason, ct);
        return Ok(result);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReservationsAsync([FromQuery] DateTime? date, [FromQuery] ReservationStatus? status, CancellationToken ct)
    {
        var result = await _reservationService.GetReservationsAsync(date, status, ct);
        return Ok(result);
    }

    [HttpGet("{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReservationByCodeAsync(string code, CancellationToken ct)
    {
        var result = await _reservationService.GetReservationByCodeAsync(code, ct);
        return Ok(result);
    }

    [HttpGet("available-slots")]
    [HttpGet("available-tables")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableTimeSlotsAsync([FromQuery] DateTime reservationTime, [FromQuery] int partySize, [FromQuery] TableZone? zone, CancellationToken ct)
    {
        var result = await _reservationService.GetAvailableTimeSlotsAsync(reservationTime, partySize, zone, ct);
        return Ok(result);
    }
}
