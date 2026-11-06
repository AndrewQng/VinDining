namespace API.Models.Common;

public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message = "Bạn không có quyền thực hiện thao tác này.")
        : base(message)
    {
    }
}

public class ConflictException : Exception
{
    public ConflictException(string message = "Dữ liệu đang xung đột hoặc đã bị thay đổi bởi phiên giao dịch khác.")
        : base(message)
    {
    }
}

public class AccountLockedException : Exception
{
    public DateTimeOffset? LockedUntil { get; }

    public AccountLockedException(string message = "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.", DateTimeOffset? lockedUntil = null)
        : base(message)
    {
        LockedUntil = lockedUntil;
    }
}

public record ApiErrorResponse(
    bool Success,
    int StatusCode,
    string Message,
    IDictionary<string, string[]>? Errors = null,
    string? TraceId = null,
    DateTime Timestamp = default)
{
    public DateTime Timestamp { get; init; } = Timestamp == default ? DateTime.UtcNow : Timestamp;
}
