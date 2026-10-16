using Application.Reservations.Commands.CancelReservation;
using Application.Reservations.Commands.ConfirmDepositPayment;
using Application.Reservations.Commands.CreateReservation;
using Application.Reservations.Queries.GetAvailableTables;
using Application.Reservations.Queries.GetReservationByCode;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
public class ReservationController : ApiControllerBase
{
    /// <summary>
    /// Tra cứu danh sách bàn trống khả dụng theo thời gian dùng bữa, số lượng khách và phân khu
    /// </summary>
    [HttpGet("available-tables")]
    [ProducesResponseType(typeof(List<AvailableTableDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableTables([FromQuery] DateTime reservationTime, [FromQuery] int partySize, [FromQuery] TableZone? zone)
    {
        var result = await Mediator.Send(new GetAvailableTablesQuery(reservationTime, partySize, zone));
        return Ok(result);
    }

    /// <summary>
    /// Đặt bàn trực tuyến, tạm khóa giữ bàn và sinh URL thanh toán tiền cọc VNPAY
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateReservationResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetReservationByCode), new { bookingCode = result.BookingCode }, result);
    }

    /// <summary>
    /// Tra cứu thông tin chi tiết lịch đặt bàn theo mã BookingCode
    /// </summary>
    [HttpGet("{bookingCode}")]
    [ProducesResponseType(typeof(ReservationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReservationByCode(string bookingCode)
    {
        var result = await Mediator.Send(new GetReservationByCodeQuery(bookingCode));
        return Ok(result);
    }

    /// <summary>
    /// Xác nhận thanh toán tiền cọc thành công (Dành cho cổng thanh toán VNPAY IPN callback hoặc quầy tiếp đón)
    /// </summary>
    [HttpPost("confirm-deposit")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmDeposit([FromBody] ConfirmDepositPaymentCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(new { success = result, message = "Xác nhận thanh toán tiền cọc và giữ chỗ bàn ăn thành công." });
    }

    /// <summary>
    /// Khách hàng hủy đặt bàn trước giờ hẹn và xử lý hoàn cọc theo quy tắc thời gian (>= 4 tiếng hoàn 100%, < 4 tiếng giữ cọc)
    /// </summary>
    [HttpPatch("{bookingCode}/cancel")]
    [ProducesResponseType(typeof(CancelReservationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelReservation(string bookingCode, [FromBody] CancelReservationRequest? request)
    {
        var command = new CancelReservationCommand(bookingCode, request?.Reason);
        var result = await Mediator.Send(command);
        return Ok(result);
    }
}

public record CancelReservationRequest(string? Reason);
