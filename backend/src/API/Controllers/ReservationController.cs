namespace API.Controllers;

[Route("api/reservations")]
public class ReservationController : ApiControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReservationAsync([FromBody] CreateReservationDto dto, CancellationToken ct)
    {
        var result = await _reservationService.CreateReservationAsync(dto, ct);
        return CreatedAtAction(nameof(GetReservationByCodeAsync), new { code = result.BookingCode }, result);
    }

    [HttpPost("/api/payments/vnpay-ipn")]
    public async Task<IActionResult> ProcessVnPayIpnAsync([FromForm] VnPayIpnDto paramsDto, CancellationToken ct)
    {
        var result = await _reservationService.ProcessVnPayIpnAsync(paramsDto, ct);
        return Ok(new { RspCode = "00", Message = "Confirm Success", Success = result });
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> CancelReservationAsync([FromBody] CancelReservationDto dto, CancellationToken ct)
    {
        var result = await _reservationService.CancelReservationAsync(dto, ct);
        return Ok(new { success = result, message = "Đã xử lý hủy đặt bàn." });
    }

    [HttpGet]
    public async Task<IActionResult> GetReservationsAsync([FromQuery] DateTime? date, [FromQuery] ReservationStatus? status, CancellationToken ct)
    {
        var result = await _reservationService.GetReservationsAsync(date, status, ct);
        return Ok(result);
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetReservationByCodeAsync(string code, CancellationToken ct)
    {
        var result = await _reservationService.GetReservationByCodeAsync(code, ct);
        return Ok(result);
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableTimeSlotsAsync([FromQuery] DateTime reservationTime, [FromQuery] int partySize, [FromQuery] TableZone? zone, CancellationToken ct)
    {
        var result = await _reservationService.GetAvailableTimeSlotsAsync(reservationTime, partySize, zone, ct);
        return Ok(result);
    }
}
