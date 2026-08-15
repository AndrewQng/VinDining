using System.Net;
using System.Text.Json;
using Application.Common.Exceptions;

namespace API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = HttpStatusCode.InternalServerError;
        object response = new { message = "An internal server error occurred." };

        switch (exception)
        {
            case ValidationException validationException:
                statusCode = HttpStatusCode.BadRequest;
                response = new
                {
                    message = "Validation failed.",
                    errors = validationException.Errors
                };
                break;

            case KeyNotFoundException notFoundException:
                statusCode = HttpStatusCode.NotFound;
                response = new { message = notFoundException.Message };
                break;

            case UnauthorizedAccessException unauthorizedException:
                statusCode = HttpStatusCode.Unauthorized;
                response = new { message = unauthorizedException.Message };
                break;

            default:
                statusCode = HttpStatusCode.InternalServerError;
                response = new { message = exception.Message };
                break;
        }

        context.Response.StatusCode = (int)statusCode;
        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await context.Response.WriteAsync(jsonResponse);
    }
}
