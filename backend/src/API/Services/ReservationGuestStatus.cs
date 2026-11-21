namespace API.Services;

public static class ReservationGuestStatus
{
    public const string PendingDeposit = "PendingDeposit";
    public const string Reserved = "Reserved";
    public const string CheckedIn = "CheckedIn";
    public const string ExpiredCancelled = "Expired_Cancelled";
    public const string CancelledRefunded = "Cancelled_Refunded";
    public const string CancelledForfeited = "Cancelled_Forfeited";
    public const string RefundRejected = "RefundRejected";

    public const string UnpaidCancellationMarker = "(Chưa thanh toán cọc)";
    public const string RefundRejectedMarker = "[REFUND_REJECTED]";
    public const string RefundRejectedPrefix = "Từ chối hoàn cọc:";
    public const string RefundApprovedPrefix = "Duyệt hoàn cọc:";
    public const string HoldExpiredReasonPhrase = "quá thời hạn thanh toán tiền cọc";
    public const string VnPayFailedReasonPhrase = "Thanh toán cọc VNPAY không thành công";

    public static string BuildHoldExpiredReason(int lockMinutes)
        => $"Tự động hủy do {HoldExpiredReasonPhrase} {lockMinutes} phút.";

    public static string BuildVnPayFailedReason(string? responseCode)
        => $"{VnPayFailedReasonPhrase} (Mã phản hồi: {responseCode ?? "N/A"}).";

    public static string BuildRefundRejectedReason(string? existingReason, string note)
        => $"{existingReason ?? "Hủy muộn"} | {RefundRejectedMarker} {RefundRejectedPrefix} {note}";

    public static string BuildRefundApprovedReason(string? existingReason, string note)
        => $"{existingReason ?? "Hủy ngoại lệ"} | {RefundApprovedPrefix} {note}";

    public static bool IsUnpaidOrExpiredReason(string? cancelledReason)
    {
        if (string.IsNullOrWhiteSpace(cancelledReason))
            return false;

        return cancelledReason.Contains(HoldExpiredReasonPhrase, StringComparison.OrdinalIgnoreCase) ||
               cancelledReason.Contains(VnPayFailedReasonPhrase, StringComparison.OrdinalIgnoreCase) ||
               cancelledReason.Contains(UnpaidCancellationMarker, StringComparison.OrdinalIgnoreCase);
    }

    public static string From(Reservation reservation)
    {
        return reservation.Status switch
        {
            ReservationStatus.Pending => PendingDeposit,
            ReservationStatus.Confirmed => Reserved,
            ReservationStatus.Completed => CheckedIn,
            ReservationStatus.Cancelled => FromCancelled(reservation),
            _ => Reserved
        };
    }

    private static string FromCancelled(Reservation reservation)
    {
        if (reservation.Deposit?.Status == DepositStatus.Refunded)
            return CancelledRefunded;

        var reason = reservation.CancelledReason ?? string.Empty;
        if (reason.Contains(RefundRejectedMarker, StringComparison.Ordinal) ||
            reason.Contains(RefundRejectedPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return RefundRejected;
        }

        if (IsUnpaidOrExpiredReason(reason))
            return ExpiredCancelled;

        return CancelledForfeited;
    }
}
