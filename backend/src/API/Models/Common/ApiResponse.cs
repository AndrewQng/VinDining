namespace API.Models.Common;

/// <summary>
/// Standardized envelope for successful API responses.
/// </summary>
public record ApiResponse<T>(
    bool Success,
    int StatusCode,
    string Message,
    T? Data = default,
    string? TraceId = null,
    DateTime Timestamp = default)
{
    public DateTime Timestamp { get; init; } = Timestamp == default ? DateTime.UtcNow : Timestamp;

    /// <summary>
    /// Creates a 200 OK <see cref="ApiResponse{T}"/> payload.
    /// </summary>
    public static ApiResponse<T> Ok(T data, string message = "Thành công.", string? traceId = null) =>
        new(
            Success: true,
            StatusCode: StatusCodes.Status200OK,
            Message: message,
            Data: data,
            TraceId: traceId,
            Timestamp: DateTime.UtcNow);

    /// <summary>
    /// Creates a 201 Created <see cref="ApiResponse{T}"/> payload.
    /// </summary>
    public static ApiResponse<T> Created(T data, string message = "Khởi tạo thành công.", string? traceId = null) =>
        new(
            Success: true,
            StatusCode: StatusCodes.Status201Created,
            Message: message,
            Data: data,
            TraceId: traceId,
            Timestamp: DateTime.UtcNow);
}
