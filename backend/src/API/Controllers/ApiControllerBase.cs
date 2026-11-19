using API.Models.Common;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// Wraps a payload in a standardized 200 OK <see cref="ApiResponse{T}"/> response.
    /// </summary>
    protected IActionResult OkResponse<T>(T data, string message = "Thành công.") =>
        Ok(ApiResponse<T>.Ok(data, message, HttpContext?.TraceIdentifier));

    /// <summary>
    /// Wraps a newly created payload in a standardized 201 Created <see cref="ApiResponse{T}"/> response.
    /// </summary>
    protected IActionResult CreatedResponse<T>(T data, string message = "Khởi tạo thành công.") =>
        StatusCode(StatusCodes.Status201Created, ApiResponse<T>.Created(data, message, HttpContext?.TraceIdentifier));
}
