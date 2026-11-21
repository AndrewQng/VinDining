using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using API.Data;
using API.DTOs;
using API.Models.Common;
using API.Models.Entities;
using API.Models.Enums;
using API.Services;
using API.Services.Interfaces;
using API.Workers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace UnitTests;

public class ReservationAndPaymentTests
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

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

    private sealed class RecordingPaymentGateway : IPaymentGateway
    {
        public List<(string TransactionId, decimal Amount, string Reason)> Refunds { get; } = new();

        public string GeneratePaymentUrl(string bookingCode, decimal amount, string description, string? clientIp = null)
            => $"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount={(long)Math.Round(amount * 100m, 0)}&vnp_TxnRef={bookingCode}";

        public Task<bool> RefundAsync(string transactionId, decimal amount, string reason, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(transactionId) || amount <= 0)
                return Task.FromResult(false);

            Refunds.Add((transactionId, amount, reason));
            return Task.FromResult(true);
        }

        public bool VerifyIpnSignature(VnPayIpnDto ipnDto, IDictionary<string, string>? rawParams = null) => true;
    }

    private sealed class ReservationTestApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = $"VinDiningBookingTests_{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("Jwt:Secret", "ReservationTestJwtSecretKey_Minimum32CharsLong2026!");
            builder.ConfigureServices(services =>
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(_dbName));
            });
        }
    }

    [Fact]
    public async Task CreateReservation_StandardAndSetMenu_CalculatesDeposit_PreservesSetMenu_AndLocks17Minutes()
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
        Assert.Null(res1.PreOrderedTastingMenuId);
        Assert.Contains("vnp_SecureHash=", res1.PaymentUrl);
        Assert.InRange((res1.ExpireAt - before).TotalMinutes, 16.9, 17.2);
        Assert.Equal(TableStatus.LockedForPayment, (await context.Tables.FindAsync(table1.Id))!.Status);

        // 2. Pre-selected Set Menu deposit = 30% * 2,000,000 * 4 = 2,400,000 VND & preserves Set Menu metadata
        var res2 = await service.CreateReservationAsync(new CreateReservationDto(
            "Trần Bảo Ngọc",
            "0987654321",
            "ngoc@example.com",
            table2.Id,
            DateTime.UtcNow.AddHours(6),
            4,
            "Bàn yên tĩnh",
            tastingMenu.Id));

        Assert.Equal(2_400_000m, res2.DepositAmount);
        Assert.Equal(tastingMenu.Id, res2.PreOrderedTastingMenuId);
        Assert.Equal("Autumn Degustation", res2.PreOrderedTastingMenuName);

        var detail2 = await service.GetReservationByCodeAsync(res2.BookingCode);
        Assert.Equal(tastingMenu.Id, detail2.PreOrderedTastingMenuId);
        Assert.Equal("Autumn Degustation", detail2.PreOrderedTastingMenuName);
        Assert.Equal("Bàn yên tĩnh", detail2.Note);
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
    public async Task ProcessVnPayIpn_RejectsTamperedAmount_EvenWithValidSignature_AndConfirmsExactAmount()
    {
        var secret = "TEST_HMAC_AMOUNT_SECRET_2026";
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["VnPay:TmnCode"] = "VD001",
                ["VnPay:HashSecret"] = secret
            })
            .Build();

        var gateway = new VnPayPaymentGateway(config);
        using var context = CreateContext();
        var table = new Table { TableNumber = "AMT-01", Capacity = 4, Status = TableStatus.Available };
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var service = new ReservationService(context, gateway, new RecordingTableNotifier());
        // 2 guests -> expected deposit = 1,000,000 VND -> expected vnp_Amount = 100,000,000
        var created = await service.CreateReservationAsync(
            new CreateReservationDto("Guest Amount", "0912000111", "amt@vn.vn", table.Id, DateTime.UtcNow.AddHours(5), 2));

        static (VnPayIpnDto Dto, SortedDictionary<string, string> Raw) BuildSignedIpn(string secretKey, string txnRef, string vnpAmount)
        {
            var raw = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["vnp_Amount"] = vnpAmount,
                ["vnp_BankCode"] = "NCB",
                ["vnp_ResponseCode"] = "00",
                ["vnp_TransactionNo"] = "99887766",
                ["vnp_TxnRef"] = txnRef
            };
            var hashData = string.Join("&", raw.Select(kv => $"{System.Net.WebUtility.UrlEncode(kv.Key)}={System.Net.WebUtility.UrlEncode(kv.Value)}"));
            var sig = VnPayPaymentGateway.ComputeHmacSha512(secretKey, hashData);
            return (new VnPayIpnDto(txnRef, vnpAmount, "00", "99887766", "NCB", sig), raw);
        }

        // 1. Signed IPN with tampered amount (only 10,000 VND instead of 1,000,000 VND) must be rejected!
        var (underpaidDto, underpaidRaw) = BuildSignedIpn(secret, created.BookingCode, "1000000");
        var detailedReject = await service.ProcessVnPayIpnDetailedAsync(underpaidDto, underpaidRaw);
        Assert.False(detailedReject.Success);
        Assert.Equal("04", detailedReject.RspCode);

        var resAfterReject = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.Id == created.ReservationId);
        Assert.Equal(ReservationStatus.Pending, resAfterReject.Status);
        Assert.Equal(DepositStatus.Pending, resAfterReject.Deposit!.Status);
        Assert.Equal(TableStatus.LockedForPayment, (await context.Tables.FindAsync(table.Id))!.Status);

        // 2. Signed IPN with exact amount (1,000,000 * 100 = 100,000,000) succeeds!
        var (exactDto, exactRaw) = BuildSignedIpn(secret, created.BookingCode, "100000000");
        var accepted = await service.ProcessVnPayIpnAsync(exactDto, exactRaw);
        Assert.True(accepted);
        Assert.Equal(ReservationStatus.Confirmed, (await context.Reservations.FindAsync(created.ReservationId))!.Status);
        Assert.Equal(TableStatus.Reserved, (await context.Tables.FindAsync(table.Id))!.Status);
    }

    [Fact]
    public async Task ProcessVnPayIpn_LateIpnAfter17mTimeoutAndTableRebooked_AutoRefunds100PercentWithoutHijackingTable()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var gateway = new RecordingPaymentGateway();
        var reservationService = new ReservationService(context, gateway, notifier);
        var lockCleaner = new ExpiredReservationLockService(context, notifier);

        var table = new Table { TableNumber = "SD10-01", Capacity = 4, Status = TableStatus.Available };
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var diningSlot = DateTime.UtcNow.AddHours(5);
        var guestABooking = await reservationService.CreateReservationAsync(
            new CreateReservationDto("Guest A Late", "0901112222", "guesta@vn.vn", table.Id, diningSlot, 2));

        // Simulate 18 minutes passing -> Background Worker expires Guest A's hold & releases table
        var released = await lockCleaner.ReleaseExpiredLocksAsync(DateTime.UtcNow.AddMinutes(18));
        Assert.Equal(1, released);
        Assert.Equal(ReservationStatus.Cancelled, (await context.Reservations.FindAsync(guestABooking.ReservationId))!.Status);
        Assert.Equal(TableStatus.Available, (await context.Tables.FindAsync(table.Id))!.Status);

        // Guest B now books & confirms the released table (or walk-in occupies it)
        var guestBBooking = await reservationService.CreateReservationAsync(
            new CreateReservationDto("Guest B OnTime", "0903334444", "guestb@vn.vn", table.Id, diningSlot, 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(guestBBooking.BookingCode, "TXN-GUEST-B"));

        // Walk-in / Guest B checks in so table is now Occupied
        var trackedTable = await context.Tables.FindAsync(table.Id);
        trackedTable!.Status = TableStatus.Occupied;
        await context.SaveChangesAsync();
        notifier.StatusEvents.Clear();

        // Now VNPAY delivers a Late IPN ("00") for Guest A's expired reservation!
        var lateIpn = new VnPayIpnDto(
            vnp_TxnRef: guestABooking.BookingCode,
            vnp_Amount: "100000000",
            vnp_ResponseCode: "00",
            vnp_TransactionNo: "VNP-LATE-777",
            vnp_BankCode: "VCB",
            vnp_SecureHash: null);

        var lateDetailed = await reservationService.ProcessVnPayIpnDetailedAsync(lateIpn);
        Assert.True(lateDetailed.Success);
        Assert.Equal("00", lateDetailed.RspCode);
        Assert.False(lateDetailed.IsPaid);
        Assert.True(lateDetailed.IsAutoRefunded);

        // Guest A's reservation MUST stay Cancelled, Deposit MUST be 100% Refunded, and Table MUST remain Occupied untouched!
        var guestARes = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.Id == guestABooking.ReservationId);
        Assert.Equal(ReservationStatus.Cancelled, guestARes.Status);
        Assert.Equal(DepositStatus.Refunded, guestARes.Deposit!.Status);
        Assert.Equal(1_000_000m, guestARes.Deposit.RefundAmount);
        Assert.Contains("hoàn 100%", guestARes.CancelledReason);
        Assert.Single(gateway.Refunds);
        Assert.Equal(("VNP-LATE-777", 1_000_000m), (gateway.Refunds[0].TransactionId, gateway.Refunds[0].Amount));

        Assert.Equal(TableStatus.Occupied, (await context.Tables.FindAsync(table.Id))!.Status);
        Assert.Empty(notifier.StatusEvents);

        // Duplicate delivery of Late IPN must be idempotent (no second refund!)
        var duplicateResult = await reservationService.ProcessVnPayIpnAsync(lateIpn);
        Assert.True(duplicateResult);
        Assert.Single(gateway.Refunds);
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
    public async Task MultiSlotReservations_CancelExpireAndNoShow_PreserveOtherActiveReservationsAndOrders()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var gateway = new RecordingPaymentGateway();
        var service = new ReservationService(context, gateway, notifier);
        var lockCleaner = new ExpiredReservationLockService(context, notifier);

        var table = new Table { TableNumber = "MULTI-01", Capacity = 4, Status = TableStatus.Available };
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        // Slot 1 (Lunch +5h) Confirmed & Slot 2 (Dinner +9h) Confirmed on the SAME table
        var lunch = await service.CreateReservationAsync(
            new CreateReservationDto("Lunch Guest", "0906000001", "l@vn.vn", table.Id, DateTime.UtcNow.AddHours(5), 2));
        await service.ConfirmDepositAsync(new ConfirmDepositDto(lunch.BookingCode, "TX-LUNCH"));

        var dinner = await service.CreateReservationAsync(
            new CreateReservationDto("Dinner Guest", "0906000002", "d@vn.vn", table.Id, DateTime.UtcNow.AddHours(9), 2));
        await service.ConfirmDepositAsync(new ConfirmDepositDto(dinner.BookingCode, "TX-DINNER"));

        // Slot 3 (+13h) Pending created 20m ago -> expiring Slot 3 MUST keep table Reserved for Lunch & Dinner!
        var staleSlot = new Reservation
        {
            BookingCode = "VD-STALE-MULTI",
            GuestId = (await context.Guests.FirstAsync()).Id,
            TableId = table.Id,
            PartySize = 2,
            ReservationTime = DateTime.UtcNow.AddHours(13),
            Status = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow.AddMinutes(-20)
        };
        await context.Reservations.AddAsync(staleSlot);
        await context.SaveChangesAsync();

        var expiredCount = await lockCleaner.ReleaseExpiredLocksAsync(DateTime.UtcNow);
        Assert.Equal(1, expiredCount);
        Assert.Equal(TableStatus.Reserved, (await context.Tables.FindAsync(table.Id))!.Status);

        // Cancelling Lunch while Dinner is still Confirmed MUST preserve Table.Status == Reserved!
        await service.CancelReservationAsync(new CancelReservationDto(lunch.BookingCode, "Hủy ca trưa"));
        Assert.Equal(TableStatus.Reserved, (await context.Tables.FindAsync(table.Id))!.Status);

        // Add an overdue Confirmed slot (-20m) and mark NoShow while Dinner (+9h) is still Confirmed -> preserves Reserved!
        var overdueSlot = new Reservation
        {
            BookingCode = "VD-NOSHOW-MULTI",
            GuestId = (await context.Guests.FirstAsync()).Id,
            TableId = table.Id,
            PartySize = 2,
            ReservationTime = DateTime.UtcNow.AddMinutes(-20),
            Status = ReservationStatus.Confirmed,
            CreatedAt = DateTime.UtcNow.AddHours(-3)
        };
        await context.Reservations.AddAsync(overdueSlot);
        await context.SaveChangesAsync();

        await service.MarkNoShowAsync("VD-NOSHOW-MULTI");
        Assert.Equal(TableStatus.Reserved, (await context.Tables.FindAsync(table.Id))!.Status);

        // Finally cancelling Dinner (the last active reservation) releases table to Available!
        await service.CancelReservationAsync(new CancelReservationDto(dinner.BookingCode, "Hủy ca tối"));
        Assert.Equal(TableStatus.Available, (await context.Tables.FindAsync(table.Id))!.Status);
    }

    [Fact]
    public async Task CancelReservation_FourHourBoundary_RefundsOrForfeits_AndManualOverrideWorks()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var gateway = new MockPaymentGateway();
        var reservationService = new ReservationService(context, gateway, notifier);
        var refundService = new RefundService(context, gateway, notifier);

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

    [Fact]
    public async Task CancelReservation_VerifiesPhoneNumber_AndBlocksPastReservationTime()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var gateway = new RecordingPaymentGateway();
        var service = new ReservationService(context, gateway, notifier);

        var t1 = new Table { TableNumber = "P-01", Capacity = 2, Status = TableStatus.Available };
        var t2 = new Table { TableNumber = "P-02", Capacity = 2, Status = TableStatus.Available };
        await context.Tables.AddRangeAsync(t1, t2);
        await context.SaveChangesAsync();

        var booking = await service.CreateReservationAsync(
            new CreateReservationDto("Phone Check Guest", "0912345678", "phone@vn.vn", t1.Id, DateTime.UtcNow.AddHours(5), 2));
        await service.ConfirmDepositAsync(new ConfirmDepositDto(booking.BookingCode, "TX-PHONE"));

        // 1. Wrong phone number on lookup or cancellation throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetReservationByCodeAsync(booking.BookingCode, "0999888777"));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CancelReservationAsync(new CancelReservationDto(booking.BookingCode, "Hủy giả mạo", "0999888777")));

        // 2. Normalized matching phone (+84 912 345 678 == 0912345678) succeeds!
        var cancelOk = await service.CancelReservationAsync(
            new CancelReservationDto(booking.BookingCode, "Hủy hợp lệ", "+84 912-345-678"));
        Assert.True(cancelOk.Success);
        Assert.True(cancelOk.IsRefunded);

        // 3. Past reservation time cannot be cancelled online via CancelReservationAsync (UC-U3 precondition)
        var pastGuest = new Guest { FullName = "Past Guest", PhoneNumber = "0907000111", Email = "past@vn.vn" };
        var pastRes = new Reservation
        {
            BookingCode = "VD-PAST-001",
            Guest = pastGuest,
            GuestId = pastGuest.Id,
            Table = t2,
            TableId = t2.Id,
            PartySize = 2,
            ReservationTime = DateTime.UtcNow.AddMinutes(-10),
            Status = ReservationStatus.Confirmed
        };
        var pastDep = new Deposit
        {
            ReservationId = pastRes.Id,
            Amount = 1_000_000m,
            TransactionId = "TX-PAST",
            Status = DepositStatus.Paid,
            PaidAt = DateTime.UtcNow.AddHours(-2)
        };
        t2.Status = TableStatus.Reserved;
        await context.Guests.AddAsync(pastGuest);
        await context.Reservations.AddAsync(pastRes);
        await context.Deposits.AddAsync(pastDep);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CancelReservationAsync(new CancelReservationDto("VD-PAST-001", "Quá giờ hẹn")));
    }

    [Fact]
    public async Task RefundService_BlocksPostDiningDoubleRefund_ReleasesTableOnConfirmedException_AndHandlesRejection()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var gateway = new RecordingPaymentGateway();
        var reservationService = new ReservationService(context, gateway, notifier);
        var refundService = new RefundService(context, gateway, notifier);

        var staff = new Staff
        {
            FullName = "Cashier Test",
            Username = "cashier1",
            Email = "c@vn.vn",
            PhoneNumber = "0900",
            PasswordHash = "pw",
            Role = StaffRole.Admin
        };
        var settledTable = new Table { TableNumber = "RF-SETTLED", Capacity = 2, Status = TableStatus.Available };
        var confirmedTable = new Table { TableNumber = "RF-CONFIRMED", Capacity = 2, Status = TableStatus.Available };
        var rejectTable = new Table { TableNumber = "RF-REJECT", Capacity = 2, Status = TableStatus.Available };
        await context.Staffs.AddAsync(staff);
        await context.Tables.AddRangeAsync(settledTable, confirmedTable, rejectTable);
        await context.SaveChangesAsync();

        // 1. Post-dining double-refund fraud prevention: reservation already settled with Invoice
        var dinedBooking = await reservationService.CreateReservationAsync(
            new CreateReservationDto("Dined Guest", "0908000001", "dined@vn.vn", settledTable.Id, DateTime.UtcNow.AddHours(2), 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(dinedBooking.BookingCode, "TX-DINED"));

        var dinedOrder = new Order
        {
            TableId = settledTable.Id,
            ReservationId = dinedBooking.ReservationId,
            CreateById = staff.Id,
            Status = OrderStatus.Completed,
            ClosedAt = DateTime.UtcNow
        };
        var settledInvoice = new Invoice
        {
            OrderId = dinedOrder.Id,
            SettleById = staff.Id,
            Subtotal = 2_000_000m,
            ServiceCharge = 100_000m,
            VatAmount = 210_000m,
            DeductedDeposit = 1_000_000m,
            IsPaid = true
        };
        // Even if someone tampered Reservation.Status to Cancelled, settled Order/Invoice MUST block manual refund!
        var trackedDinedRes = await context.Reservations.FindAsync(dinedBooking.ReservationId);
        trackedDinedRes!.Status = ReservationStatus.Cancelled;
        await context.Orders.AddAsync(dinedOrder);
        await context.Invoices.AddAsync(settledInvoice);
        await context.SaveChangesAsync();

        var pendingQueue = await refundService.GetRefundRequestsAsync();
        Assert.DoesNotContain(pendingQueue, r => r.ReservationId == dinedBooking.ReservationId);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            refundService.OverrideRefundAsync(dinedBooking.ReservationId, new ManualRefundDto("Gian lận hoàn cọc sau ăn", 1_000_000m, IsApproved: true)));
        Assert.Empty(gateway.Refunds);

        // 2. Confirmed reservation exception refund -> cancels reservation AND releases Table from Reserved to Available + notifies!
        var exceptionBooking = await reservationService.CreateReservationAsync(
            new CreateReservationDto("Exception Guest", "0908000002", "exc@vn.vn", confirmedTable.Id, DateTime.UtcNow.AddHours(1), 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(exceptionBooking.BookingCode, "TX-EXC"));
        Assert.Equal(TableStatus.Reserved, (await context.Tables.FindAsync(confirmedTable.Id))!.Status);
        notifier.StatusEvents.Clear();

        var approved = await refundService.OverrideRefundAsync(
            exceptionBooking.ReservationId,
            new ManualRefundDto("Nhà hàng sự cố điện đột xuất, hoàn cọc 100%", 0m, IsApproved: true));
        Assert.True(approved);

        var updatedExcRes = await context.Reservations.Include(r => r.Deposit).FirstAsync(r => r.Id == exceptionBooking.ReservationId);
        Assert.Equal(ReservationStatus.Cancelled, updatedExcRes.Status);
        Assert.Equal(DepositStatus.Refunded, updatedExcRes.Deposit!.Status);
        Assert.Equal(TableStatus.Available, (await context.Tables.FindAsync(confirmedTable.Id))!.Status);
        Assert.Contains(notifier.StatusEvents, e => e.TableId == confirmedTable.Id && e.Status == TableStatus.Available);

        // 3. Rejected manual refund -> appends marker, removes from pending queue, and blocks duplicate rejection
        var rejectBooking = await reservationService.CreateReservationAsync(
            new CreateReservationDto("Reject Guest", "0908000003", "rej@vn.vn", rejectTable.Id, DateTime.UtcNow.AddHours(1), 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(rejectBooking.BookingCode, "TX-REJ"));
        await reservationService.CancelReservationAsync(new CancelReservationDto(rejectBooking.BookingCode, "Đổi ý sát giờ"));

        Assert.Contains(await refundService.GetRefundRequestsAsync(), r => r.ReservationId == rejectBooking.ReservationId);

        var rejectedOk = await refundService.OverrideRefundAsync(
            rejectBooking.ReservationId,
            new ManualRefundDto("Không thuộc diện bất khả kháng", 0m, IsApproved: false));
        Assert.True(rejectedOk);

        var afterRejectQueue = await refundService.GetRefundRequestsAsync();
        Assert.DoesNotContain(afterRejectQueue, r => r.ReservationId == rejectBooking.ReservationId);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            refundService.OverrideRefundAsync(rejectBooking.ReservationId, new ManualRefundDto("Từ chối lặp lại", 0m, IsApproved: false)));
    }

    [Fact]
    public async Task ReservationReminderWorker_DispatchesReminderOnceForConfirmedWithinTwoHours()
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        await using var provider = services.BuildServiceProvider();

        var now = DateTime.UtcNow;
        await using (var scope = provider.CreateAsyncScope())
        {
            var ctx = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var guest = new Guest { FullName = "Reminder Guest", PhoneNumber = "0909123123", Email = "remind@vn.vn" };
            var table = new Table { TableNumber = "R-01", Capacity = 2, Status = TableStatus.Reserved };
            var dueRes = new Reservation
            {
                BookingCode = "VD-REMIND-DUE",
                Guest = guest,
                GuestId = guest.Id,
                Table = table,
                TableId = table.Id,
                PartySize = 2,
                ReservationTime = now.AddMinutes(90),
                Status = ReservationStatus.Confirmed
            };
            var dueDep = new Deposit { ReservationId = dueRes.Id, Amount = 1_000_000m, Status = DepositStatus.Paid, PaidAt = now.AddHours(-2) };

            var farRes = new Reservation
            {
                BookingCode = "VD-REMIND-FAR",
                Guest = guest,
                GuestId = guest.Id,
                Table = table,
                TableId = table.Id,
                PartySize = 2,
                ReservationTime = now.AddHours(5),
                Status = ReservationStatus.Confirmed
            };

            await ctx.Guests.AddAsync(guest);
            await ctx.Tables.AddAsync(table);
            await ctx.Reservations.AddRangeAsync(dueRes, farRes);
            await ctx.Deposits.AddAsync(dueDep);
            await ctx.SaveChangesAsync();
        }

        var worker = new ReservationReminderWorker(provider.GetRequiredService<IServiceScopeFactory>());
        var firstScan = await worker.ScanAndSendRemindersAsync(now);
        var secondScan = await worker.ScanAndSendRemindersAsync(now.AddMinutes(5));

        Assert.Equal(1, firstScan);
        Assert.Equal(0, secondScan);
    }

    [Fact]
    public async Task HttpEndpoints_EnforceReservationListPiiRbac_ValidateIpnAmount_AndExposeManagerRefundRoutes()
    {
        await using var factory = new ReservationTestApiFactory();
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/testing/seed", null)).StatusCode);

        // 1. Anonymous GET /api/reservations must be blocked with 401 Unauthorized (protecting all guests' PII!)
        var anonListRes = await client.GetAsync("/api/reservations");
        Assert.Equal(HttpStatusCode.Unauthorized, anonListRes.StatusCode);

        // 2. Staff login -> GET /api/reservations succeeds
        var adminAuth = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("admin_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);
        Assert.NotNull(adminAuth);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth!.Token);
        var staffListRes = await client.GetAsync("/api/reservations");
        Assert.Equal(HttpStatusCode.OK, staffListRes.StatusCode);

        // 3. Guest creates reservation anonymously -> tampered IPN returns RspCode "04" -> cancel <4h -> Manager approves via /api/manager/... alias!
        client.DefaultRequestHeaders.Authorization = null;
        var slots = await client.GetFromJsonAsync<List<AvailableTableDto>>(
            $"/api/reservations/available-slots?reservationTime={Uri.EscapeDataString(DateTime.UtcNow.AddHours(2).ToString("O"))}&partySize=2",
            JsonOpts);
        Assert.NotEmpty(slots!);

        var createdHttp = await client.PostAsJsonAsync("/api/reservations", new CreateReservationDto(
            "Trần Minh Quân",
            "0918887777",
            "quan@vn.vn",
            slots![0].Id,
            DateTime.UtcNow.AddHours(2),
            2));
        Assert.Equal(HttpStatusCode.Created, createdHttp.StatusCode);
        var created = await createdHttp.Content.ReadFromJsonAsync<CreateReservationResultDto>(JsonOpts);

        // Tampered amount IPN (500 VND instead of 1,000,000 VND) -> RspCode "04"
        var badIpnRes = await client.PostAsync("/api/payments/vnpay-ipn", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["vnp_TxnRef"] = created!.BookingCode,
            ["vnp_Amount"] = "50000",
            ["vnp_ResponseCode"] = "00",
            ["vnp_TransactionNo"] = "VNP-TAMPER"
        }));
        var badIpnJson = await badIpnRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("04", badIpnJson.GetProperty("rspCode").GetString());
        Assert.False(badIpnJson.GetProperty("success").GetBoolean());

        // Valid amount IPN -> RspCode "00"
        var okIpnRes = await client.PostAsync("/api/payments/vnpay-ipn", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["vnp_TxnRef"] = created.BookingCode,
            ["vnp_Amount"] = "100000000",
            ["vnp_ResponseCode"] = "00",
            ["vnp_TransactionNo"] = "VNP-VALID-01"
        }));
        var okIpnJson = await okIpnRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("00", okIpnJson.GetProperty("rspCode").GetString());

        // Cancel with wrong phone -> 401 Unauthorized
        var wrongPhoneCancel = await client.PatchAsJsonAsync(
            $"/api/reservations/{created.BookingCode}/cancel",
            new CancelReservationBodyDto("Hủy nhầm SĐT", "0900000000"));
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPhoneCancel.StatusCode);

        // Cancel <4h with matching phone -> 200 OK (forfeited deposit)
        var validCancel = await client.PatchAsJsonAsync(
            $"/api/reservations/{created.BookingCode}/cancel",
            new CancelReservationBodyDto("Sự cố chuyến bay", "0918887777"));
        Assert.Equal(HttpStatusCode.OK, validCancel.StatusCode);

        // Manager accesses `/api/manager/refunds` and `/api/manager/reservations/{id}/manual-refund` aliases
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth.Token);
        var managerRefundList = await client.GetFromJsonAsync<List<RefundRequestDto>>("/api/manager/refunds", JsonOpts);
        Assert.Contains(managerRefundList!, r => r.ReservationId == created.ReservationId);

        var manualRefundRes = await client.PostAsJsonAsync(
            $"/api/manager/reservations/{created.ReservationId}/manual-refund",
            new ManualRefundDto("Duyệt hoàn cọc ngoại lệ do hãng bay delay", 1_000_000m, IsApproved: true));
        Assert.Equal(HttpStatusCode.OK, manualRefundRes.StatusCode);
    }

    [Fact]
    public async Task GetReservations_ExcludesSyntheticWalkInFeedbackAnchors_KeepingOnlineBookingsPure()
    {
        using var context = CreateContext();
        var service = new ReservationService(context, new MockPaymentGateway(), new RecordingTableNotifier());

        var guest = new Guest { FullName = "Thực khách", PhoneNumber = "0905000999", Email = "walk@vn.vn" };
        var table = new Table { TableNumber = "M-09", Capacity = 4, Status = TableStatus.Available };
        await context.Guests.AddAsync(guest);
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var online = await service.CreateReservationAsync(
            new CreateReservationDto("Nguyễn Online", "0905111222", "online@vn.vn", table.Id, DateTime.UtcNow.AddHours(4), 2));

        var syntheticWalkInAnchor = new Reservation
        {
            BookingCode = "WALKIN-ABCDEF12",
            GuestId = guest.Id,
            TableId = table.Id,
            PartySize = 1,
            ReservationTime = DateTime.UtcNow,
            Status = ReservationStatus.Completed
        };
        await context.Reservations.AddAsync(syntheticWalkInAnchor);
        await context.SaveChangesAsync();

        var list = await service.GetReservationsAsync();
        Assert.Contains(list, r => r.BookingCode == online.BookingCode);
        Assert.DoesNotContain(list, r => r.BookingCode.StartsWith("WALKIN-", StringComparison.Ordinal));

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.GetReservationByCodeAsync("WALKIN-ABCDEF12"));
    }

    [Theory]
    [InlineData(ReservationStatus.Pending, DepositStatus.Pending, null, "PendingDeposit")]
    [InlineData(ReservationStatus.Confirmed, DepositStatus.Paid, null, "Reserved")]
    [InlineData(ReservationStatus.Completed, DepositStatus.Paid, null, "CheckedIn")]
    [InlineData(ReservationStatus.Cancelled, DepositStatus.Forfeited, "Tự động hủy do quá thời hạn thanh toán tiền cọc 17 phút.", "Expired_Cancelled")]
    [InlineData(ReservationStatus.Cancelled, DepositStatus.Forfeited, "Thanh toán cọc VNPAY không thành công (Mã phản hồi: 24).", "Expired_Cancelled")]
    [InlineData(ReservationStatus.Cancelled, DepositStatus.Refunded, "Khách hủy trước 4 giờ", "Cancelled_Refunded")]
    [InlineData(ReservationStatus.Cancelled, DepositStatus.Forfeited, "Hủy sát giờ", "Cancelled_Forfeited")]
    [InlineData(ReservationStatus.Cancelled, DepositStatus.Forfeited, "Hủy muộn | [REFUND_REJECTED] Từ chối hoàn cọc: Không hợp lệ", "RefundRejected")]
    public void ReservationGuestStatus_MapsAllSevenFrontendValues(
        ReservationStatus status,
        DepositStatus depositStatus,
        string? cancelledReason,
        string expectedGuestStatus)
    {
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            BookingCode = "VD-TEST",
            Status = status,
            CancelledReason = cancelledReason,
            Deposit = new Deposit
            {
                Id = Guid.NewGuid(),
                Status = depositStatus,
                Amount = 1_000_000m
            }
        };

        var actual = ReservationGuestStatus.From(reservation);
        Assert.Equal(expectedGuestStatus, actual);
        Assert.Equal(expectedGuestStatus, ReservationService.MapToDetailDto(reservation).GuestStatus);
    }
}
