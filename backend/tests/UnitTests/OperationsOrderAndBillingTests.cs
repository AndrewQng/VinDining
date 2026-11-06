using System.Collections.Concurrent;
using System.Text;
using API.Data;
using API.DTOs;
using API.Models.Common;
using API.Models.Entities;
using API.Models.Enums;
using API.Services;
using API.Services.Interfaces;
using API.Workers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace UnitTests;

public class OperationsOrderAndBillingTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private sealed class FakeCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public bool IsAuthenticated => UserId.HasValue || !string.IsNullOrEmpty(Role);
    }

    private sealed class RecordingTableNotifier : ITableNotifier
    {
        public List<(Guid TableId, TableStatus Status)> StatusUpdates { get; } = new();
        public List<(Guid TableId, Guid OrderId, decimal Subtotal)> CheckoutRequests { get; } = new();
        public List<ServiceCallResponseDto> ServiceCalls { get; } = new();

        public Task NotifyTableStatusChangedAsync(Guid tableId, string tableNumber, TableStatus newStatus, CancellationToken cancellationToken = default)
        {
            StatusUpdates.Add((tableId, newStatus));
            return Task.CompletedTask;
        }

        public Task NotifyCheckoutRequestedAsync(Guid tableId, string tableNumber, Guid orderId, decimal estimatedSubtotal = 0m, CancellationToken cancellationToken = default)
        {
            CheckoutRequests.Add((tableId, orderId, estimatedSubtotal));
            return Task.CompletedTask;
        }

        public Task NotifyServiceCallCreatedAsync(ServiceCallResponseDto serviceCall, CancellationToken cancellationToken = default)
        {
            ServiceCalls.Add(serviceCall);
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingKitchenNotifier : IKitchenNotifier
    {
        public int NewOrderCount { get; private set; }
        public List<CourseType> FiredCourses { get; } = new();
        public List<(Guid ItemId, string? Reason)> Remakes { get; } = new();
        public List<Guid> ServedItems { get; } = new();
        public List<(Guid ItemId, string Level)> SlaAlerts { get; } = new();

        public Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default)
        {
            NewOrderCount++;
            return Task.CompletedTask;
        }

        public Task NotifyCourseFiredAsync(Guid orderId, string tableNumber, CourseType courseType, CancellationToken cancellationToken = default)
        {
            FiredCourses.Add(courseType);
            return Task.CompletedTask;
        }

        public Task NotifyItemRemakeAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        {
            Remakes.Add((orderItemId, reason));
            return Task.CompletedTask;
        }

        public Task NotifyItemServedAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default)
        {
            ServedItems.Add(orderItemId);
            return Task.CompletedTask;
        }

        public Task NotifySlaAlertAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string slaStatus, int elapsedSeconds, int prepTimeMinutes, CancellationToken cancellationToken = default)
        {
            SlaAlerts.Add((orderItemId, slaStatus));
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task OrderOrchestration_CourseFiring_PassRbac_Remake_Sla_AndBillingDepositDeduction()
    {
        using var context = CreateContext();
        var tableNotifier = new RecordingTableNotifier();
        var kitchenNotifier = new RecordingKitchenNotifier();
        var currentUser = new FakeCurrentUserService();

        var waiter = new Staff { FullName = "Waiter", Username = "w1", Email = "w1@vn.vn", PhoneNumber = "0901", PasswordHash = "pw", Role = StaffRole.Waitstaff };
        var expediter = new Staff { FullName = "Expediter", Username = "e1", Email = "e1@vn.vn", PhoneNumber = "0902", PasswordHash = "pw", Role = StaffRole.Expediter };
        await context.Staffs.AddRangeAsync(waiter, expediter);

        var cat = new Category { Name = "Signature" };
        var soup = new MenuItem { Name = "Lobster Soup", Price = 400_000m, CourseType = CourseType.Appetizer, PrepTimeMinutes = 10, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Wagyu A5", Price = 1_600_000m, CourseType = CourseType.MainCourse, PrepTimeMinutes = 20, Category = cat, Status = "Available" };
        var wine = new MenuItem { Name = "Grand Cru Glass", Price = 500_000m, CourseType = CourseType.Beverage, PrepTimeMinutes = 5, Category = cat, Status = "Available" };
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(soup, wagyu, wine);

        var tableVip1 = new Table { TableNumber = "VIP-01", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Available };
        var tableVip2 = new Table { TableNumber = "VIP-02", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Available };
        await context.Tables.AddRangeAsync(tableVip1, tableVip2);
        await context.SaveChangesAsync();

        var reservationService = new ReservationService(context, new MockPaymentGateway(), tableNotifier);
        var tableService = new TableService(context, tableNotifier);
        var orderService = new OrderService(context, currentUser, kitchenNotifier, tableNotifier);
        var invoiceService = new InvoiceService(context, currentUser, tableNotifier);

        // 1. Guest books VIP-01 for 2 guests -> Deposit = 1,000,000 VND Paid -> Host checks in
        var booking = await reservationService.CreateReservationAsync(new CreateReservationDto("Phạm Hoàng", "0908889999", "hoang@vn.vn", tableVip1.Id, DateTime.UtcNow.AddHours(2), 2));
        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(booking.BookingCode, "VNP-999"));
        await tableService.CheckInReservationAsync(tableVip1.Id, new CheckInDto(BookingCode: booking.BookingCode));

        // 2. Waitstaff creates multi-course order (Appetizer + Beverage fire immediately; MainCourse stays Hold)
        currentUser.UserId = waiter.Id;
        currentUser.Role = nameof(StaffRole.Waitstaff);
        var orderId = await orderService.CreateOrderWithCoursesAsync(new CreateOrderDto(
            tableVip1.Id,
            Items: new List<OrderItemRequestDto>
            {
                new(soup.Id, 2, "Ít kem"),
                new(wagyu.Id, 2, "Medium rare"),
                new(wine.Id, 2)
            }));

        var detail = await orderService.GetOrderDetailsAsync(orderId);
        Assert.Equal(OrderItemStatus.Preparing, detail.Items.Single(i => i.MenuItemId == soup.Id).Status);
        Assert.Equal(OrderItemStatus.Preparing, detail.Items.Single(i => i.MenuItemId == wine.Id).Status);
        Assert.Equal(OrderItemStatus.Hold, detail.Items.Single(i => i.MenuItemId == wagyu.Id).Status);

        // 3. Waitstaff CANNOT confirm served at Pass (RBAC -> ForbiddenAccessException)
        var soupOrderItemId = detail.Items.Single(i => i.MenuItemId == soup.Id).Id;
        var wineOrderItemId = detail.Items.Single(i => i.MenuItemId == wine.Id).Id;
        var wagyuOrderItemId = detail.Items.Single(i => i.MenuItemId == wagyu.Id).Id;

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => orderService.ConfirmServedAsync(orderId, soupOrderItemId));

        // 4. Expediter serves Appetizer & Wine; SLA Monitor checks overdue MainCourse after firing
        currentUser.UserId = expediter.Id;
        currentUser.Role = nameof(StaffRole.Expediter);
        await orderService.ConfirmServedAsync(orderId, soupOrderItemId);
        await orderService.ConfirmServedAsync(orderId, wineOrderItemId);

        // Attempting to settle while MainCourse is still Hold must fail!
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            invoiceService.SettleInvoiceAsync(tableVip1.Id, new SettleInvoiceDto(orderId, PaymentMethod.Card, waiter.Id)));

        // 5. Fire MainCourse -> Expediter requests Remake (RUSH) -> KDS sorts RUSH first -> SLA Alert -> Confirm Served
        var fired = await orderService.FireNextCourseAsync(orderId, new FireCourseDto(CourseType.MainCourse));
        Assert.Equal(1, fired);

        await orderService.RemakeOrderItemAsync(orderId, wagyuOrderItemId, new RemakeItemDto("Độ chín chưa đạt Medium Rare"));
        var kdsQueue = await orderService.GetKitchenPendingOrdersAsync();
        Assert.Single(kdsQueue);
        Assert.True(kdsQueue[0].IsRush);

        var slaService = new OrderSlaMonitorService(context, kitchenNotifier, new ConcurrentDictionary<Guid, string>());
        var alerts = await slaService.ScanSlaViolationsAsync(DateTime.UtcNow.AddMinutes(21));
        Assert.Equal(1, alerts);
        Assert.Contains(kitchenNotifier.SlaAlerts, a => a.ItemId == wagyuOrderItemId && a.Level == "Overdue");

        await orderService.ConfirmServedAsync(orderId, wagyuOrderItemId);

        // 6. Transfer table VIP-01 -> VIP-02 mid-meal and verify deposit + order move to VIP-02!
        await tableService.TransferTableAsync(tableVip1.Id, new TransferTableDto(tableVip2.Id, "Khách muốn góc yên tĩnh hơn"));
        Assert.Equal(TableStatus.Cleaning, (await context.Tables.FindAsync(tableVip1.Id))!.Status);
        Assert.Equal(TableStatus.Occupied, (await context.Tables.FindAsync(tableVip2.Id))!.Status);

        // 7. Request checkout & verify exact Fine Dining Invoice math on VIP-02:
        // Subtotal = 2*400k + 2*1,600k + 2*500k = 5,000,000
        // ServiceCharge (5%) = 250,000
        // VAT (10% of 5,250,000) = 525,000
        // Gross = 5,775,000 | Deposit Deducted = 1,000,000 -> FinalAmount = 4,775,000
        await invoiceService.RequestCheckoutAsync(tableVip2.Id);
        Assert.Single(tableNotifier.CheckoutRequests);

        var preview = await invoiceService.CalculateInvoiceAsync(tableVip2.Id);
        Assert.False(preview.HasUnservedItems);
        Assert.Equal(5_000_000m, preview.Subtotal);
        Assert.Equal(250_000m, preview.ServiceCharge);
        Assert.Equal(525_000m, preview.VatAmount);
        Assert.Equal(1_000_000m, preview.DeductedDeposit);
        Assert.Equal(4_775_000m, preview.FinalAmount);

        var invoiceId = await invoiceService.SettleInvoiceByOrderAsync(new SettleInvoiceDto(orderId, PaymentMethod.Card, waiter.Id));
        var settledInvoice = await invoiceService.GetInvoiceByIdAsync(invoiceId);
        Assert.Equal(4_775_000m, settledInvoice.FinalTotal);
        Assert.Equal(TableStatus.Cleaning, (await context.Tables.FindAsync(tableVip2.Id))!.Status);

        // 8. Verify ReportService metrics & CSV export
        var reportService = new ReportService(context);
        var metrics = await reportService.GetMetricsAsync(new DateRangeDto(DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1)));
        Assert.Equal(5_775_000m, metrics.TotalRevenue);
        Assert.Equal(1_000_000m, metrics.DeductedDepositTotal);
        Assert.NotEmpty(metrics.TopSellingItems);

        var csvBytes = await reportService.ExportRevenueReportAsync(new DateRangeDto());
        var csvText = Encoding.UTF8.GetString(csvBytes);
        Assert.Contains("BAO CAO DOANH THU", csvText);
        Assert.Contains("Wagyu A5", csvText);
    }

    [Fact]
    public async Task MinimumSpendRule_WhenDepositExceedsGrossBill_FinalAmountClampsToZero()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var currentUser = new FakeCurrentUserService { Role = nameof(StaffRole.Expediter) };

        var staff = new Staff { FullName = "Expediter", Username = "exp2", Email = "exp2@vn.vn", PhoneNumber = "0909", PasswordHash = "pw", Role = StaffRole.Expediter };
        var cat = new Category { Name = "Drinks" };
        var tea = new MenuItem { Name = "Artisan Oolong", Price = 200_000m, CourseType = CourseType.Beverage, Category = cat, Status = "Available" };
        var table = new Table { TableNumber = "M-05", Capacity = 4, Status = TableStatus.Available };
        await context.Staffs.AddAsync(staff);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddAsync(tea);
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var resSvc = new ReservationService(context, new MockPaymentGateway(), notifier);
        var orderSvc = new OrderService(context, currentUser, new RecordingKitchenNotifier(), notifier);
        var invSvc = new InvoiceService(context, currentUser, notifier);

        // 4 guests -> 2,000,000 VND deposit, but only order 400,000 VND tea (Gross = 462,000 VND < 2,000,000 VND)
        var res = await resSvc.CreateReservationAsync(new CreateReservationDto("Min Spend", "0907778888", "min@vn.vn", table.Id, DateTime.UtcNow.AddHours(3), 4));
        await resSvc.ConfirmDepositAsync(new ConfirmDepositDto(res.BookingCode, "TX-MIN"));

        var orderId = await orderSvc.CreateOrderWithCoursesAsync(new CreateOrderDto(table.Id, res.ReservationId, staff.Id, new List<OrderItemRequestDto> { new(tea.Id, 2) }));
        var order = await orderSvc.GetOrderDetailsAsync(orderId);
        await orderSvc.ConfirmServedAsync(orderId, order.Items[0].Id);

        var preview = await invSvc.CalculateInvoiceAsync(table.Id);
        Assert.Equal(400_000m, preview.Subtotal);
        Assert.Equal(2_000_000m, preview.DeductedDeposit);
        Assert.Equal(0m, preview.FinalAmount);
    }

    [Fact]
    public async Task AuthLockout_AndMenuCacheInvalidation_BehaveDeterministically()
    {
        using var context = CreateContext();
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var hasher = new PasswordHasher<Staff>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "UnitTestSecretKeyMinimum32CharactersLong2026!",
                ["Jwt:Issuer"] = "VinDining",
                ["Jwt:Audience"] = "VinDiningClient"
            })
            .Build();

        var staff = new Staff { FullName = "Lock Test", Username = "brute_target", Email = "bt@vn.vn", PhoneNumber = "0900", Role = StaffRole.Admin, IsActive = true };
        staff.PasswordHash = hasher.HashPassword(staff, "RightPassword123");
        await context.Staffs.AddAsync(staff);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, new JwtTokenService(config), new FakeCurrentUserService(), hasher, cache);

        // 5 consecutive wrong attempts -> 6th attempt throws AccountLockedException even with right password!
        for (int i = 0; i < 5; i++)
        {
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                authService.LoginAsync(new LoginDto("brute_target", "WrongPass")));
        }

        await Assert.ThrowsAsync<AccountLockedException>(() =>
            authService.LoginAsync(new LoginDto("brute_target", "RightPassword123")));

        // Menu cache invalidation test
        var adminMenu = new AdminMenuService(context, cache);
        var publicMenu = new MenuService(context, cache);

        var catId = await adminMenu.CreateCategoryAsync(new CreateCategoryDto("Caviar"));
        var itemId = await adminMenu.CreateMenuItemAsync(new CreateMenuItemDto("Beluga Caviar", 3_500_000m, "30g", null, true, CourseType.Appetizer, catId, 5));

        var firstRead = await publicMenu.GetCategoriesAsync();
        Assert.Single(firstRead.Single(c => c.Id == catId).Items);

        // Mark 86'd (Unavailable) -> cache must invalidate immediately
        await adminMenu.UpdateAvailabilityAsync(itemId, new ToggleAvailabilityDto(false, "Hết hàng trong ca"));
        var secondRead = await publicMenu.GetCategoriesAsync();
        Assert.Empty(secondRead.Single(c => c.Id == catId).Items);
    }
}
