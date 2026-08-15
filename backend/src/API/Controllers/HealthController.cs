using Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public HealthController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        bool canConnect = false;
        try
        {
            if (_context is DbContext dbContext)
            {
                canConnect = await dbContext.Database.CanConnectAsync();
            }
        }
        catch
        {
            canConnect = false;
        }

        return Ok(new
        {
            status = "Online",
            timestampUtc = DateTime.UtcNow,
            databaseConnected = canConnect,
            databaseProvider = "Microsoft SQL Server",
            framework = ".NET 9.0 Clean Architecture"
        });
    }
}
