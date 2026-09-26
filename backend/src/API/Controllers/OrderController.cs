using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
public class OrderController : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateOrder()
    {
        await Task.CompletedTask;
        return Ok();
    }
}
