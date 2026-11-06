using API.Data;
using API.DTOs;
using API.Models.Common;
using API.Models.Entities;
using API.Models.Enums;
using API.Services;
using API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace UnitTests;

public class ReservationAndPaymentTests
{
    private static ApplicationDbContext CreateContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private sealed class RecordingTableNotifier : ITableNotifier
    {
        public List<(Guid TableId, TableStatus Status)> StatusEvents { get; } = new();

        public Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default)
        {
            StatusEvents.Add((tableId, newStatus));
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task CreateReservation_StandardAndSetMenu_CalculatesDepositAndLocks17Minutes()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["VnPay:TmnCode"] = "VINDININGTEST",
                ["VnPay:HashSecret"] = "SUPERSECRETHMACSHA512KEYFORVINDINING2026"
            })
            .Build();
        var gateway = new VnPayPaymentGateway(config);
        var service = new ReservationService(context, gateway, notifier, new TableConcurrencyLock());

        var table1 = new Table { TableNumber = "VIP-01", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Available };
        var table2 = new Table { TableNumber = "VIP-02", Capacity = 6, Zone = TableZone.VIP, Status = TableStatus.Available };
        var tastingMenu = new TastingMenu { Name = "Autumn Degustation", Price = 2_000_000m, IsActive = true };
        await context.Tables.AddRangeAsync(table1, table2);
        await context.TastingMenus.AddAsync(tastingMenu);
        await context.SaveChangesAsync();

        // 1. Standard A La Carte deposit = 500,000 * 4 = 2,000,000 VND
        var before = DateTime.UtcNow;
        var res1 = await service.CreateReservationAsync(new CreateReservationDto(
            "Nguyễn Minh Khoa",
            "0912345678",
            "khoa@example.com",
            table1.Id,
            DateTime.UtcNow.AddHours(6),
            4,
            "Kỷ niệm ngày cưới"));

        Assert.Equal(2_000_000m, res1.DepositAmount);
        Assert.Contains("vnp_SecureHash=", res1.PaymentUrl);
        Assert.InRange((res1.ExpireAt - before).TotalMinutes, 16.9, 17.2);
        Assert.Equal(TableStatus.LockedForPayment, (await context.Tables.FindAsync(table1.Id))!.Status);

        // 2. Pre-selected Set Menu deposit = 30% * 2,000,000 * 4 = 2,400,000 VND
        var res2 = await service.CreateReservationAsync(new CreateReservationDto(
            "Trần Bảo Ngọc",
            "0987654321",
            "ngoc@example.com",
            table2.Id,
            DateTime.UtcNow.AddHours(6),
            4,
            "Set Menu mùa thu",
            tastingMenu.Id));

        Assert.Equal(2_400_000m, res2.DepositAmount);
    }

    [Fact]
    public async Task CreateReservation_ConcurrentRequestsSameTable_AllowsOnlyOneAndThrowsConflict()
    {
        var dbName = Guid.NewGuid().ToString();
        var sharedLock = new TableConcurrencyLock();
        var notifier = new RecordingTableNotifier();
        var gateway = new MockPaymentGateway();

        using (var seedCtx = CreateContext(dbName))
        {
            seedCtx.Tables.Add(new Table
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001"),
                TableNumber = "M-01",
                Capacity = 4,
                Status = TableStatus.Available
            });
            await seedCtx.SaveChangesAsync();
        }

        var slot = DateTime.UtcNow.AddHours(5);
        var tableId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");

        async Task<CreateReservationResultDto> AttemptBookingAsync(string phone)
        {
            using var ctx = CreateContext(dbName);
            var svc = new ReservationService(ctx, gateway, notifier, sharedLock);
            return await svc.CreateReservationAsync(new CreateReservationDto(
                $"Guest {phone}",
                phone,
                $"{phone}@test.vn",
                tableId,
                slot,
                2));
        }

        var tasks = new[]
        {
            AttemptBookingAsync("0900000001"),
            AttemptBookingAsync("0900000002"),
            AttemptBookingAsync("0900000003")
        };

        var outcomes = await Task.WhenAll(tasks.Select(async t =>
        {
            try
            {
                var ok = await t;
                return (Success: true, Error: (Exception?)null, Result: (CreateReservationResultDto?)ok);
            }
            catch (Exception ex)
            {
                return (Success: false, Error: ex, Result: null);
            }
        }));

        Assert.Single(outcomes, o => o.Success);
        Assert.Equal(2, outcomes.Count(o => !o.Success && o.Error is ConflictException));
    }

    [Fact]
    public async Task VnPayGateway_VerifiesValidSignature_AndRejectsTamperedHash()
    {
        var secret = "TEST_HMAC_SECRET_KEY_2026_VINDINING";
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["VnPay:TmnCode"] = "VD001",
                ["VnPay:HashSecret"] = secret
            })
            .Build();

        var gateway = new VnPayPaymentGateway(config);
        var raw = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Amount"] = "100000000",
            ["vnp_BankCode"] = "NCB",
            ["vnp_ResponseCode"] = "00",
            ["vnp_TransactionNo"] = "14559988",
            ["vnp_TxnRef"] = "VD-261106-ABCDE"
        };

        var hashInput = string.Join("&", raw.Select(kv => $"{System.Net.WebUtility.UrlEncode(kv.Key)}={System.Net.WebUtility.UrlEncode(kv.Value)}"));
        var validHash = VnPayPaymentGateway.ComputeHmacSha512(secret, hashInput);

        var validIpn = new VnPayIpnDto("VD-261106-ABCDE", "100000000", "00", "14559988", "NCB", validHash);
        var tamperedIpn = validIpn with { vnp_SecureHash = "deadbeef0000" };

        Assert.True(gateway.VerifyIpnSignature(validIpn, raw));
        Assert.False(gateway.VerifyIpnSignature(tamperedIpn, raw));

        using var context = CreateContext();
        var table = new Table { TableNumber = "B-01", Capacity = 2, Status = TableStatus.Available };
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var service = new ReservationService(context, gateway, new RecordingTableNotifier());
        var created = await service.CreateReservationAsync(new CreateReservationDto("Le A", "0911111111", "a@vn.vn", table.Id, DateTime.UtcNow.AddHours(5), 2));

        // Tampered IPN is rejected
        var rejected = await service.ProcessVnPayIpnAsync(tamperedIpn with { vnp_TxnRef = created.BookingCode });
        Assert.False(rejected);
    }

    [Fact]
    public async Task ExpiredReservationLockService_ReleasesPendingOlderThan17Minutes_KeepsFreshOnes()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();

        var guest = new Guest { FullName = "Guest Lock", PhoneNumber = "0905556666", Email = "lock@vn.vn" };
        var expiredTable = new Table { TableNumber = "EXP-01", Capacity = 4, Status = TableStatus.LockedForPayment };
        var freshTable = new Table { TableNumber = "FRESH-01", Capacity = 4, Status = TableStatus.LockedForPayment };
        await context.Guests.AddAsync(guest);
        await context.Tables.AddRangeAsync(expiredTable, freshTable);

        var now = DateTime.UtcNow;
        var expiredRes = new Reservation
        {
            BookingCode = "VD-EXPIRED",
            GuestId = guest.Id,
            TableId = expiredTable.Id,
            PartySize = 2,
            ReservationTime = now.AddHours(4),
            Status = ReservationStatus.Pending,
            CreatedAt = now.AddMinutes(-18)
        };
        var expiredDep = new Deposit
        {
            ReservationId = expiredRes.Id,
            Amount = 1_000_000m,
            Status = DepositStatus.Pending,
            CreatedAt = now.AddMinutes(-18)
        };

        var freshRes = new Reservation
        {
            BookingCode = "VD-FRESH",
            GuestId = guest.Id,
            TableId = freshTable.Id,
            PartySize = 2,
            ReservationTime = now.AddHours(4),
            Status = ReservationStatus.Pending,
            CreatedAt = now.AddMinutes(-10)
        };
        var freshDep = new Deposit
        {
            ReservationId = freshRes.Id,
            Amount = 1_000_000m,
            Status = DepositStatus.Pending,
            CreatedAt = now.AddMinutes(-10)
        };

        await context.Reservations.AddRangeAsync(expiredRes, freshRes);
        await context.Deposits.AddRangeAsync(expiredDep, freshDep);
        await context.SaveChangesAsync();

        var lockCleaner = new ExpiredReservationLockService(context, notifier);
        var released = await lockCleaner.ReleaseExpiredLocksAsync(now);

        Assert.Equal(1, released);
        Assert.Equal(ReservationStatus.Cancelled, (await context.Reservations.FindAsync(expiredRes.Id))!.Status);
        Assert.Equal(DepositStatus.Forfeited, (await context.Deposits.FindAsync(expiredDep.Id))!.Status);
        Assert.Equal(TableStatus.Available, (await context.Tables.FindAsync(expiredTable.Id))!.Status);

        Assert.Equal(ReservationStatus.Pending, (await context.Reservations.FindAsync(freshRes.Id))!.Status);
        Assert.Equal(TableStatus.LockedForPayment, (await context.Tables.FindAsync(freshTable.Id))!.Status);
    }

    [Fact]
    public async Task CancelReservation_FourHourBoundary_RefundsOrForfeits_AndManualOverrideWorks()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var gateway = new MockPaymentGateway();
        var reservationService = new ReservationService(context, gateway, notifier);
        var refundService = new RefundService(context, gateway);

        var t1 = new Table { TableNumber = "C-01", Capacity = 2, Status = TableStatus.Available };
        var t2 = new Table { TableNumber = "C-02", Capacity = 2, Status = TableStatus.Available };
        await context.Tables.AddRangeAsync(t1, t2);
        await context.SaveChangesAsync();

        // Case 1: >= 4 hours ahead -> 100% automatic refund
        var early = await reservationService.CreateReservationAsync(new CreateReservationDto("Early Guest", "0901000001", "e1@vn.vn", t1.Id, DateTime.UtcNow.AddHours(6), 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(early.BookingCode, "TXN-EARLY"));

        var earlyCancel = await reservationService.CancelReservationAsync(new CancelReservationDto(early.BookingCode, "Đổi lịch công tác"));
        Assert.True(earlyCancel.IsRefunded);
        Assert.Equal(1_000_000m, earlyCancel.RefundAmount);

        // Case 2: < 4 hours ahead -> forfeited, then Manager overrides manual refund
        var late = await reservationService.CreateReservationAsync(new CreateReservationDto("Late Guest", "0901000002", "e2@vn.vn", t2.Id, DateTime.UtcNow.AddHours(2), 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(late.BookingCode, "TXN-LATE"));

        var lateCancel = await reservationService.CancelReservationAsync(new CancelReservationDto(late.BookingCode, "Sự cố y tế khẩn cấp"));
        Assert.False(lateCancel.IsRefunded);
        Assert.Equal(0m, lateCancel.RefundAmount);

        var pendingOverrides = await refundService.GetRefundRequestsAsync();
        Assert.Contains(pendingOverrides, r => r.BookingCode == late.BookingCode && r.DepositStatus == "Forfeited");

        var overrideOk = await refundService.OverrideRefundAsync(late.ReservationId, new ManualRefundDto("Duyệt ngoại lệ có giấy xác nhận bệnh viện", 1_000_000m, IsApproved: true));
        Assert.True(overrideOk);

        var updatedDeposit = await context.Deposits.FirstAsync(d => d.ReservationId == late.ReservationId);
        Assert.Equal(DepositStatus.Refunded, updatedDeposit.Status);
        Assert.Equal(1_000_000m, updatedDeposit.RefundAmount);
    }
}
