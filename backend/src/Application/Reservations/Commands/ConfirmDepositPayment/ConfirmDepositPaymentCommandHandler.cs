using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reservations.Commands.ConfirmDepositPayment;

public class ConfirmDepositPaymentCommandHandler : IRequestHandler<ConfirmDepositPaymentCommand, bool>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ITableNotifier _tableNotifier;

    public ConfirmDepositPaymentCommandHandler(
        IApplicationDbContext dbContext,
        ITableNotifier tableNotifier)
    {
        _dbContext = dbContext;
        _tableNotifier = tableNotifier;
    }

    public async Task<bool> Handle(ConfirmDepositPaymentCommand request, CancellationToken cancellationToken)
    {
        var reservation = await _dbContext.Reservations
            .Include(r => r.Deposit)
            .Include(r => r.Table)
            .FirstOrDefaultAsync(r => r.BookingCode == request.BookingCode.Trim(), cancellationToken);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy lịch đặt bàn với mã {request.BookingCode}.");

        if (reservation.Status == ReservationStatus.Confirmed)
            return true; // Idempotent

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException($"Lịch đặt bàn {request.BookingCode} đã bị hủy, không thể xác nhận thanh toán.");

        // Cập nhật trạng thái thanh toán tiền cọc
        if (reservation.Deposit != null)
        {
            reservation.Deposit.Status = DepositStatus.Paid;
            reservation.Deposit.PaidAt = DateTime.UtcNow;
            reservation.Deposit.TransactionId = request.TransactionId;
            reservation.Deposit.PaymentMethod = request.PaymentMethod;
        }

        // Chuyển lịch đặt bàn sang Confirmed và chuyển bàn sang Reserved
        reservation.Status = ReservationStatus.Confirmed;

        if (reservation.Table != null)
        {
            reservation.Table.Status = TableStatus.Reserved;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        if (reservation.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(
                reservation.Table.Id,
                reservation.Table.TableNumber,
                TableStatus.Reserved,
                cancellationToken);
        }

        return true;
    }
}
