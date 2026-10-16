using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reservations.Commands.CancelReservation;

public class CancelReservationCommandHandler : IRequestHandler<CancelReservationCommand, CancelReservationResultDto>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IPaymentGateway _paymentGateway;
    private readonly ITableNotifier _tableNotifier;

    public CancelReservationCommandHandler(
        IApplicationDbContext dbContext,
        IPaymentGateway paymentGateway,
        ITableNotifier tableNotifier)
    {
        _dbContext = dbContext;
        _paymentGateway = paymentGateway;
        _tableNotifier = tableNotifier;
    }

    public async Task<CancelReservationResultDto> Handle(CancelReservationCommand request, CancellationToken cancellationToken)
    {
        var reservation = await _dbContext.Reservations
            .Include(r => r.Deposit)
            .Include(r => r.Table)
            .FirstOrDefaultAsync(r => r.BookingCode == request.BookingCode.Trim(), cancellationToken);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy lịch đặt bàn với mã {request.BookingCode}.");

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException($"Lịch đặt bàn {request.BookingCode} đã được hủy trước đó.");

        if (reservation.Status == ReservationStatus.Completed)
            throw new InvalidOperationException($"Không thể hủy lịch đặt bàn đã hoàn tất bữa ăn phục vụ.");

        var now = DateTime.UtcNow;
        var hoursUntilDining = (reservation.ReservationTime - now).TotalHours;

        bool isRefunded = false;
        decimal refundAmount = 0m;
        string message;

        if (reservation.Deposit != null && reservation.Deposit.Status == DepositStatus.Paid)
        {
            // Quy tắc hoàn tiền cọc Fine Dining:
            // Hủy trước tối thiểu 04 tiếng: Tự động hoàn lại 100% tiền cọc
            if (hoursUntilDining >= 4.0)
            {
                isRefunded = true;
                refundAmount = reservation.Deposit.Amount;
                reservation.Deposit.Status = DepositStatus.Refunded;
                reservation.Deposit.RefundAmount = refundAmount;

                await _paymentGateway.RefundAsync(
                    reservation.Deposit.TransactionId,
                    refundAmount,
                    $"Hoan coc 100% cho lich dat ban {reservation.BookingCode} huy truoc 4 tieng",
                    cancellationToken);

                message = $"Hủy đặt bàn thành công. Quý khách đã hủy trước giờ hẹn {hoursUntilDining:F1} giờ (>= 4 giờ), hệ thống tự động hoàn lại 100% tiền cọc ({refundAmount:#,##0} VNĐ).";
            }
            else
            {
                // Hủy dưới 04 tiếng: Giữ lại toàn bộ tiền cọc làm chi phí chuẩn bị
                isRefunded = false;
                refundAmount = 0m;
                reservation.Deposit.Status = DepositStatus.Forfeited;
                reservation.Deposit.RefundAmount = 0m;

                message = $"Hủy đặt bàn thành công. Do thời gian hủy còn {hoursUntilDining:F1} giờ (< 4 giờ), toàn bộ tiền cọc ({reservation.Deposit.Amount:#,##0} VNĐ) được giữ lại làm phí bù hoàn chuẩn bị.";
            }
        }
        else
        {
            message = "Hủy lịch đặt bàn chưa nộp cọc thành công.";
        }

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = now;
        reservation.CancelledReason = request.Reason;

        // Giải phóng bàn ăn về Available nếu bàn đang bị khóa hoặc giữ chỗ
        if (reservation.Table != null &&
            (reservation.Table.Status == TableStatus.Reserved || reservation.Table.Status == TableStatus.LockedForPayment))
        {
            reservation.Table.Status = TableStatus.Available;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        if (reservation.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(
                reservation.Table.Id,
                reservation.Table.TableNumber,
                reservation.Table.Status,
                cancellationToken);
        }

        return new CancelReservationResultDto
        {
            BookingCode = reservation.BookingCode,
            Status = reservation.Status.ToString(),
            IsRefunded = isRefunded,
            RefundAmount = refundAmount,
            Message = message
        };
    }
}
