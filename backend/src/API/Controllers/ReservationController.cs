using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
public class ReservationController : ApiControllerBase
{
    // Endpoints will dispatch CQRS commands/queries via MediatR (ISender)
    
    [HttpPost]
    public async Task<IActionResult> CreateReservation()
    {
        // var result = await Mediator.Send(new CreateReservationCommand(...));
        return Ok(new { Message = "Reservation CQRS Command placeholder" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReservation(Guid id)
    {
        // var result = await Mediator.Send(new GetReservationQuery(id));
        return Ok(new { Message = "Reservation CQRS Query placeholder" });
    }
}
