using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reservations.Commands.CreateReservation;

public class CreateReservationCommandHandler : IRequestHandler<CreateReservationCommand, CreateReservationResultDto>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IPaymentGateway _paymentGateway;
    private readonly ITableNotifier _tableNotifier;

    // Tiền cọc tiêu chuẩn cố định cho mỗi lượt đặt bàn Fine Dining là 500.000 VNĐ
    private const decimal StandardDepositAmount = 500000m;

    public CreateReservationCommandHandler(
        IApplicationDbContext dbContext,
        IPaymentGateway paymentGateway,
        ITableNotifier tableNotifier)
    {
        _dbContext = dbContext;
        _paymentGateway = paymentGateway;
        _tableNotifier = tableNotifier;
    }

    public async Task<CreateReservationResultDto> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra bàn tồn tại và sức chứa
        var table = await _dbContext.Tables
            .FirstOrDefaultAsync(t => t.Id == request.TableId, cancellationToken);

        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn với mã {request.TableId}.");

        if (table.Capacity < request.PartySize)
            throw new InvalidOperationException($"Sức chứa của bàn {table.TableNumber} ({table.Capacity} người) nhỏ hơn số lượng khách ({request.PartySize} người).");

        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, không thể đặt lúc này.");

        // 2. Kiểm tra xung đột lịch đặt trong khung giờ (120 phút)
        var requestedStart = request.ReservationTime;
        var requestedEnd = request.ReservationTime.AddMinutes(120);

        var hasConflict = await _dbContext.Reservations
            .AnyAsync(r => r.TableId == table.Id &&
                           (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending) &&
                           r.ReservationTime < requestedEnd &&
                           r.ReservationTime.AddMinutes(r.DurationMinutes) > requestedStart,
                      cancellationToken);

        if (hasConflict)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đã có người đặt trong khung giờ này. Vui lòng chọn bàn hoặc khung giờ khác.");

        // 3. Tìm hoặc khởi tạo Guest
        var guest = await _dbContext.Guests
            .FirstOrDefaultAsync(g => g.PhoneNumber == request.PhoneNumber.Trim(), cancellationToken);

        if (guest == null)
        {
            guest = new Guest
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber.Trim(),
                Email = request.Email.Trim().ToLowerInvariant()
            };
            await _dbContext.Guests.AddAsync(guest, cancellationToken);
        }
        else
        {
            // Cập nhật lại thông tin mới nhất nếu có thay đổi
            guest.FullName = request.FullName.Trim();
            guest.Email = request.Email.Trim().ToLowerInvariant();
        }

        // 4. Sinh mã đặt bàn duy nhất: VD-YYMMDD-XXXXX
        var bookingCode = $"VD-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}";

        // 5. Khởi tạo đối tượng Reservation và Deposit
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            BookingCode = bookingCode,
            GuestId = guest.Id,
            Guest = guest,
            TableId = table.Id,
            Table = table,
            ReservationTime = request.ReservationTime,
            PartySize = request.PartySize,
            DurationMinutes = 120,
            Status = ReservationStatus.Pending,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        var deposit = new Deposit
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            Reservation = reservation,
            Amount = StandardDepositAmount,
            Status = DepositStatus.Pending,
            PaymentMethod = PaymentMethod.BankTransfer,
            CreatedAt = DateTime.UtcNow
        };

        reservation.Deposit = deposit;

        // 6. Khóa giữ bàn tạm thời (TableStatus.LockedForPayment)
        table.Status = TableStatus.LockedForPayment;

        await _dbContext.Reservations.AddAsync(reservation, cancellationToken);
        await _dbContext.Deposits.AddAsync(deposit, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // 7. Tạo URL thanh toán qua cổng VNPAY
        var paymentDescription = $"Dat coc giu cho ban {table.TableNumber} ma {bookingCode}";
        var paymentUrl = _paymentGateway.GeneratePaymentUrl(bookingCode, StandardDepositAmount, paymentDescription);

        // Thời gian giữ chỗ thanh toán là 17 phút (15 phút VNPAY + 2 phút ân hạn)
        var expiresAt = DateTime.UtcNow.AddMinutes(17);

        // Phát thông báo thời gian thực cập nhật sơ đồ bàn
        await _tableNotifier.NotifyTableStatusChangedAsync(
            table.Id,
            table.TableNumber,
            TableStatus.LockedForPayment,
            cancellationToken);

        return new CreateReservationResultDto
        {
            ReservationId = reservation.Id,
            BookingCode = bookingCode,
            TableNumber = table.TableNumber,
            DepositAmount = StandardDepositAmount,
            PaymentUrl = paymentUrl,
            ExpiresAt = expiresAt
        };
    }
}
