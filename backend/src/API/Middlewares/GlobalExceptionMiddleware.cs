using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using API.Models.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace API.Middlewares;

public class GlobalExceptionMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment? _environment;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment? environment = null)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path} [TraceId={TraceId}]: {Message}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier,
                ex.Message);

            if (!context.Response.HasStarted)
            {
                await HandleExceptionAsync(context, ex);
            }
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            ValidationException validationEx => (
                (int)HttpStatusCode.BadRequest,
                "Dữ liệu đầu vào không hợp lệ.",
                validationEx.Errors),

            ArgumentException argumentEx => (
                (int)HttpStatusCode.BadRequest,
                argumentEx.Message,
                (IDictionary<string, string[]>?)null),

            InvalidOperationException invalidOpEx => (
                (int)HttpStatusCode.BadRequest,
                invalidOpEx.Message,
                null),

            BadHttpRequestException badReqEx => (
                (int)HttpStatusCode.BadRequest,
                badReqEx.Message,
                null),

            UnauthorizedAccessException unauthorizedEx => (
                (int)HttpStatusCode.Unauthorized,
                unauthorizedEx.Message,
                null),

            ForbiddenAccessException forbiddenEx => (
                (int)HttpStatusCode.Forbidden,
                forbiddenEx.Message,
                null),

            KeyNotFoundException notFoundEx => (
                (int)HttpStatusCode.NotFound,
                notFoundEx.Message,
                null),

            ConflictException conflictEx => (
                (int)HttpStatusCode.Conflict,
                conflictEx.Message,
                null),

            DbUpdateConcurrencyException => (
                (int)HttpStatusCode.Conflict,
                "Dữ liệu vừa được cập nhật bởi người dùng khác. Vui lòng tải lại và thử lại.",
                null),

            AccountLockedException lockedEx => (
                StatusCodes.Status423Locked,
                lockedEx.Message,
                lockedEx.LockedUntil.HasValue
                    ? new Dictionary<string, string[]>
                    {
                        ["lockedUntil"] = new[] { lockedEx.LockedUntil.Value.UtcDateTime.ToString("O") }
                    }
                    : null),

            _ => (
                (int)HttpStatusCode.InternalServerError,
                _environment?.IsProduction() == true
                    ? "Đã xảy ra lỗi hệ thống nội bộ. Vui lòng thử lại sau."
                    : exception.Message,
                null)
        };

        return WriteErrorResponseAsync(context, statusCode, message, errors);
    }

    /// <summary>
    /// Serializes a standardized camelCase <see cref="ApiErrorResponse"/> directly to the HTTP response.
    /// </summary>
    internal static async Task WriteErrorResponseAsync(
        HttpContext context,
        int statusCode,
        string message,
        IDictionary<string, string[]>? errors = null)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var payload = new ApiErrorResponse(
            Success: false,
            StatusCode: statusCode,
            Message: message,
            Errors: errors,
            TraceId: context.TraceIdentifier,
            Timestamp: DateTime.UtcNow);

        var jsonResponse = JsonSerializer.Serialize(payload, JsonOptions);
        await context.Response.WriteAsync(jsonResponse);
    }
}
