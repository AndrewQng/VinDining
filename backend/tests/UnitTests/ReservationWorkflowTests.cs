using Application.Common.Interfaces;
using Application.Reservations.Commands.CancelReservation;
using Application.Reservations.Commands.ConfirmDepositPayment;
using Application.Reservations.Commands.CreateReservation;
using Application.Reservations.Queries.GetAvailableTables;
using Application.Reservations.Queries.GetReservationByCode;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace UnitTests;

public class ReservationWorkflowTests
{
    private class FakePaymentGateway : IPaymentGateway
    {
        public List<(string TransactionId, decimal Amount, string Reason)> RefundCalls { get; } = new();

        public string GeneratePaymentUrl(string bookingCode, decimal amount, string description)
        {
            return $"https://mock.vnpay.vn/pay?code={bookingCode}&amount={amount}";
        }

        public Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default)
        {
            RefundCalls.Add((transactionId, amount, reason));
            return Task.FromResult(true);
        }
    }

    private class FakeTableNotifier : ITableNotifier
    {
        public List<(Guid TableId, string TableNumber, TableStatus Status)> TableStatusEvents { get; } = new();

        public Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default)
        {
            TableStatusEvents.Add((tableId, tableNumber, newStatus));
            return Task.CompletedTask;
        }
    }

    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetAvailableTables_ShouldFilterByCapacityZoneAndExcludeConflictingReservations()
    {
        using var context = CreateContext();

        var tableSmall = new Table { TableNumber = "M01", Capacity = 2, Zone = TableZone.MainHall, Status = TableStatus.Available };
        var tableConflict = new Table { TableNumber = "VIP01", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Available };
        var tableAvailable = new Table { TableNumber = "VIP02", Capacity = 6, Zone = TableZone.VIP, Status = TableStatus.Available };

        await context.Tables.AddRangeAsync(tableSmall, tableConflict, tableAvailable);

        var requestedTime = DateTime.UtcNow.AddDays(1).Date.AddHours(19); // 19:00 ngày mai

        // Tạo lịch đặt bàn trùng giờ cho VIP01 (từ 18:30 đến 20:30)
        var guest = new Guest { FullName = "Khách A", PhoneNumber = "0911000111", Email = "a@gmail.com" };
        var conflictRes = new Reservation
        {
            Guest = guest,
            Table = tableConflict,
            PartySize = 4,
            ReservationTime = requestedTime.AddMinutes(-30),
            DurationMinutes = 120,
            Status = ReservationStatus.Confirmed
        };

        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(conflictRes);
        await context.SaveChangesAsync();

        var handler = new GetAvailableTablesQueryHandler(context);
        var query = new GetAvailableTablesQuery(requestedTime, PartySize: 4, Zone: TableZone.VIP);

        var result = await handler.Handle(query, CancellationToken.None);

        // M01 bị loại do nhỏ hơn 4 người và khác Zone
        // VIP01 bị loại do trùng lịch đặt
        // Chỉ còn VIP02 khả dụng
        Assert.Single(result);
        Assert.Equal("VIP02", result[0].TableNumber);
        Assert.Equal(6, result[0].Capacity);
    }

    [Fact]
    public async Task CreateReservation_WhenValid_ShouldLockTableCreatePendingDepositAndGeneratePaymentUrl()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "VIP-01", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Available };
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var paymentGateway = new FakePaymentGateway();
        var tableNotifier = new FakeTableNotifier();
        var handler = new CreateReservationCommandHandler(context, paymentGateway, tableNotifier);

        var reservationTime = DateTime.UtcNow.AddDays(2);
        var command = new CreateReservationCommand(
            FullName: "Dang Quoc Khanh",
            PhoneNumber: "0987654321",
            Email: "khanh@vindining.vn",
            TableId: table.Id,
            ReservationTime: reservationTime,
            PartySize: 4,
            Note: "Bàn gần cửa sổ view đẹp"
        );

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.ReservationId);
        Assert.StartsWith("VD-", result.BookingCode);
        Assert.Equal(500000m, result.DepositAmount);
        Assert.Contains(result.BookingCode, result.PaymentUrl);

        // Kiểm tra cơ sở dữ liệu
        var reservation = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.Id == result.ReservationId);
        Assert.Equal(ReservationStatus.Pending, reservation.Status);
        Assert.NotNull(reservation.Deposit);
        Assert.Equal(DepositStatus.Pending, reservation.Deposit.Status);
        Assert.Equal(500000m, reservation.Deposit.Amount);

        // Bàn phải bị tạm khóa (LockedForPayment)
        var updatedTable = await context.Tables.FirstAsync(t => t.Id == table.Id);
        Assert.Equal(TableStatus.LockedForPayment, updatedTable.Status);

        // Kiểm tra thông báo SignalR sơ đồ bàn
        Assert.Single(tableNotifier.TableStatusEvents);
        Assert.Equal(table.Id, tableNotifier.TableStatusEvents[0].TableId);
        Assert.Equal(TableStatus.LockedForPayment, tableNotifier.TableStatusEvents[0].Status);
    }

    [Fact]
    public async Task CreateReservation_WhenTableCapacityInsufficient_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "M01", Capacity = 2, Zone = TableZone.MainHall, Status = TableStatus.Available };
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var handler = new CreateReservationCommandHandler(context, new FakePaymentGateway(), new FakeTableNotifier());

        var command = new CreateReservationCommand(
            FullName: "Khách Đặt",
            PhoneNumber: "0900000000",
            Email: "guest@vindining.vn",
            TableId: table.Id,
            ReservationTime: DateTime.UtcNow.AddDays(1),
            PartySize: 6 // Vượt quá sức chứa 2 người của bàn
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CreateReservation_WhenConflictingReservationExists_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "M02", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available };
        var guest = new Guest { FullName = "Khách Cũ", PhoneNumber = "0911222333", Email = "old@vindining.vn" };
        var resTime = DateTime.UtcNow.AddDays(1);

        var existingRes = new Reservation
        {
            Table = table,
            Guest = guest,
            PartySize = 4,
            ReservationTime = resTime,
            DurationMinutes = 120,
            Status = ReservationStatus.Confirmed
        };

        await context.Tables.AddAsync(table);
        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(existingRes);
        await context.SaveChangesAsync();

        var handler = new CreateReservationCommandHandler(context, new FakePaymentGateway(), new FakeTableNotifier());

        var command = new CreateReservationCommand(
            FullName: "Khách Mới",
            PhoneNumber: "0988999888",
            Email: "new@vindining.vn",
            TableId: table.Id,
            ReservationTime: resTime.AddMinutes(30), // Trùng trong khung 120 phút
            PartySize: 4
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ConfirmDepositPayment_WhenValid_ShouldConfirmReservationAndSetTableReserved()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "VIP-03", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.LockedForPayment };
        var guest = new Guest { FullName = "Nguyen Manh Quyen", PhoneNumber = "0977888999", Email = "quyen@vindining.vn" };
        var reservation = new Reservation
        {
            BookingCode = "VD-261016-TEST1",
            Table = table,
            Guest = guest,
            PartySize = 4,
            ReservationTime = DateTime.UtcNow.AddDays(2),
            Status = ReservationStatus.Pending
        };
        var deposit = new Deposit
        {
            Reservation = reservation,
            Amount = 500000m,
            Status = DepositStatus.Pending
        };
        reservation.Deposit = deposit;

        await context.Tables.AddAsync(table);
        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(reservation);
        await context.Deposits.AddAsync(deposit);
        await context.SaveChangesAsync();

        var tableNotifier = new FakeTableNotifier();
        var handler = new ConfirmDepositPaymentCommandHandler(context, tableNotifier);

        var command = new ConfirmDepositPaymentCommand(
            BookingCode: "VD-261016-TEST1",
            TransactionId: "VNPAY-TRANS-8888",
            PaymentMethod: PaymentMethod.BankTransfer
        );

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result);

        // Kiểm tra trạng thái đã cập nhật
        var updatedRes = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.BookingCode == "VD-261016-TEST1");
        Assert.Equal(ReservationStatus.Confirmed, updatedRes.Status);
        Assert.Equal(DepositStatus.Paid, updatedRes.Deposit?.Status);
        Assert.Equal("VNPAY-TRANS-8888", updatedRes.Deposit?.TransactionId);
        Assert.NotNull(updatedRes.Deposit?.PaidAt);

        var updatedTable = await context.Tables.FirstAsync(t => t.Id == table.Id);
        Assert.Equal(TableStatus.Reserved, updatedTable.Status);

        // Thông báo SignalR cập nhật sang Reserved
        Assert.Single(tableNotifier.TableStatusEvents);
        Assert.Equal(TableStatus.Reserved, tableNotifier.TableStatusEvents[0].Status);
    }

    [Fact]
    public async Task ConfirmDepositPayment_WhenAlreadyConfirmed_ShouldReturnTrueIdempotently()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "VIP-04", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Reserved };
        var guest = new Guest { FullName = "Khách Đã Xác Nhận", PhoneNumber = "0922333444", Email = "xn@vindining.vn" };
        var reservation = new Reservation
        {
            BookingCode = "VD-CONFIRMED",
            Table = table,
            Guest = guest,
            PartySize = 4,
            ReservationTime = DateTime.UtcNow.AddDays(1),
            Status = ReservationStatus.Confirmed
        };

        await context.Tables.AddAsync(table);
        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(reservation);
        await context.SaveChangesAsync();

        var handler = new ConfirmDepositPaymentCommandHandler(context, new FakeTableNotifier());
        var result = await handler.Handle(new ConfirmDepositPaymentCommand("VD-CONFIRMED", "TX-1"), CancellationToken.None);

        Assert.True(result);
    }

    [Fact]
    public async Task CancelReservation_WhenMoreThan4HoursBeforeDining_ShouldRefund100PercentAndFreeTable()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "BAL-01", Capacity = 4, Zone = TableZone.Balcony, Status = TableStatus.Reserved };
        var guest = new Guest { FullName = "Khách Hủy Sớm", PhoneNumber = "0944555777", Email = "som@vindining.vn" };
        var resTime = DateTime.UtcNow.AddHours(24); // Hủy trước 24 tiếng (>= 4 tiếng)

        var reservation = new Reservation
        {
            BookingCode = "VD-CANCEL-EARLY",
            Table = table,
            Guest = guest,
            PartySize = 4,
            ReservationTime = resTime,
            Status = ReservationStatus.Confirmed
        };
        var deposit = new Deposit
        {
            Reservation = reservation,
            Amount = 500000m,
            TransactionId = "VNPAY-TX-REFUND",
            Status = DepositStatus.Paid,
            PaidAt = DateTime.UtcNow.AddDays(-1)
        };
        reservation.Deposit = deposit;

        await context.Tables.AddAsync(table);
        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(reservation);
        await context.Deposits.AddAsync(deposit);
        await context.SaveChangesAsync();

        var paymentGateway = new FakePaymentGateway();
        var tableNotifier = new FakeTableNotifier();
        var handler = new CancelReservationCommandHandler(context, paymentGateway, tableNotifier);

        var command = new CancelReservationCommand("VD-CANCEL-EARLY", "Bận việc đột xuất");
        var result = await handler.Handle(command, CancellationToken.None);

        // Phải được hoàn lại 100% tiền cọc
        Assert.True(result.IsRefunded);
        Assert.Equal(500000m, result.RefundAmount);
        Assert.Contains("hoàn lại 100%", result.Message);

        // Kiểm tra cơ sở dữ liệu
        var updatedRes = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.BookingCode == "VD-CANCEL-EARLY");
        Assert.Equal(ReservationStatus.Cancelled, updatedRes.Status);
        Assert.Equal(DepositStatus.Refunded, updatedRes.Deposit?.Status);
        Assert.Equal(500000m, updatedRes.Deposit?.RefundAmount);

        // Bàn phải được giải phóng về Available
        var updatedTable = await context.Tables.FirstAsync(t => t.Id == table.Id);
        Assert.Equal(TableStatus.Available, updatedTable.Status);

        // Cổng thanh toán phải nhận được lệnh hoàn tiền
        Assert.Single(paymentGateway.RefundCalls);
        Assert.Equal("VNPAY-TX-REFUND", paymentGateway.RefundCalls[0].TransactionId);
        Assert.Equal(500000m, paymentGateway.RefundCalls[0].Amount);

        // SignalR bàn chuyển về Available
        Assert.Single(tableNotifier.TableStatusEvents);
        Assert.Equal(TableStatus.Available, tableNotifier.TableStatusEvents[0].Status);
    }

    [Fact]
    public async Task CancelReservation_WhenLessThan4HoursBeforeDining_ShouldForfeitDepositAndFreeTable()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "BAL-02", Capacity = 4, Zone = TableZone.Balcony, Status = TableStatus.Reserved };
        var guest = new Guest { FullName = "Khách Hủy Muộn", PhoneNumber = "0944555888", Email = "muon@vindining.vn" };
        var resTime = DateTime.UtcNow.AddHours(2); // Hủy trước 2 tiếng (< 4 tiếng)

        var reservation = new Reservation
        {
            BookingCode = "VD-CANCEL-LATE",
            Table = table,
            Guest = guest,
            PartySize = 4,
            ReservationTime = resTime,
            Status = ReservationStatus.Confirmed
        };
        var deposit = new Deposit
        {
            Reservation = reservation,
            Amount = 500000m,
            TransactionId = "VNPAY-TX-FORFEIT",
            Status = DepositStatus.Paid,
            PaidAt = DateTime.UtcNow.AddDays(-1)
        };
        reservation.Deposit = deposit;

        await context.Tables.AddAsync(table);
        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(reservation);
        await context.Deposits.AddAsync(deposit);
        await context.SaveChangesAsync();

        var paymentGateway = new FakePaymentGateway();
        var tableNotifier = new FakeTableNotifier();
        var handler = new CancelReservationCommandHandler(context, paymentGateway, tableNotifier);

        var command = new CancelReservationCommand("VD-CANCEL-LATE", "Hủy gấp sát giờ ăn");
        var result = await handler.Handle(command, CancellationToken.None);

        // Giữ lại toàn bộ tiền cọc
        Assert.False(result.IsRefunded);
        Assert.Equal(0m, result.RefundAmount);
        Assert.Contains("giữ lại", result.Message);

        // Kiểm tra cơ sở dữ liệu
        var updatedRes = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.BookingCode == "VD-CANCEL-LATE");
        Assert.Equal(ReservationStatus.Cancelled, updatedRes.Status);
        Assert.Equal(DepositStatus.Forfeited, updatedRes.Deposit?.Status);
        Assert.Equal(0m, updatedRes.Deposit?.RefundAmount);

        // Bàn vẫn được giải phóng về Available cho khách khác
        var updatedTable = await context.Tables.FirstAsync(t => t.Id == table.Id);
        Assert.Equal(TableStatus.Available, updatedTable.Status);

        // Không gọi lệnh refund đến cổng thanh toán
        Assert.Empty(paymentGateway.RefundCalls);
    }

    [Fact]
    public async Task GetReservationByCode_WhenValid_ShouldReturnDetailDto()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "VIP-99", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Reserved };
        var guest = new Guest { FullName = "Hoang Dat", PhoneNumber = "0933222111", Email = "dat@vindining.vn" };
        var reservation = new Reservation
        {
            BookingCode = "VD-FIND-01",
            Table = table,
            Guest = guest,
            PartySize = 4,
            ReservationTime = DateTime.UtcNow.AddDays(3),
            Status = ReservationStatus.Confirmed,
            Note = "Ăn kỷ niệm"
        };
        var deposit = new Deposit
        {
            Reservation = reservation,
            Amount = 500000m,
            Status = DepositStatus.Paid
        };
        reservation.Deposit = deposit;

        await context.Tables.AddAsync(table);
        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(reservation);
        await context.Deposits.AddAsync(deposit);
        await context.SaveChangesAsync();

        var handler = new GetReservationByCodeQueryHandler(context);
        var result = await handler.Handle(new GetReservationByCodeQuery("VD-FIND-01"), CancellationToken.None);

        Assert.Equal("VD-FIND-01", result.BookingCode);
        Assert.Equal("Hoang Dat", result.GuestName);
        Assert.Equal("VIP-99", result.TableNumber);
        Assert.Equal(500000m, result.DepositAmount);
        Assert.Equal("Paid", result.DepositStatus);
        Assert.Equal("Confirmed", result.Status);
    }
}
