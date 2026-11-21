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
        var toggledItem = Assert.Single(secondRead.Single(c => c.Id == catId).Items);
        Assert.False(toggledItem.IsAvailable);
    }

    [Fact]
    public async Task PassRbac_UnauthenticatedOrRolelessCaller_ThrowsForbiddenAccessException()
    {
        using var context = CreateContext();
        var waiter = new Staff { FullName = "Waiter", Username = "w_rbac", Email = "w_rbac@vn.vn", PhoneNumber = "0901", PasswordHash = "pw", Role = StaffRole.Waitstaff };
        var cat = new Category { Name = "Starter" };
        var soup = new MenuItem { Name = "Truffle Soup", Price = 300_000m, CourseType = CourseType.Appetizer, Category = cat, Status = "Available" };
        var table = new Table { TableNumber = "B-01", Capacity = 2, Status = TableStatus.Occupied };
        await context.Staffs.AddAsync(waiter);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddAsync(soup);
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        var unauthUser = new FakeCurrentUserService(); // IsAuthenticated == false, Role == null
        var orderService = new OrderService(context, unauthUser, new RecordingKitchenNotifier());

        var orderId = await orderService.CreateOrderWithCoursesAsync(new CreateOrderDto(table.Id, StaffId: waiter.Id, Items: new List<OrderItemRequestDto> { new(soup.Id, 1) }));
        var itemId = (await orderService.GetOrderDetailsAsync(orderId)).Items.Single().Id;

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => orderService.ConfirmServedAsync(orderId, itemId));
        await Assert.ThrowsAsync<ForbiddenAccessException>(() => orderService.RemakeOrderItemAsync(orderId, itemId));

        // Authenticated user with empty role must also be blocked
        unauthUser.UserId = waiter.Id;
        unauthUser.Role = "";
        await Assert.ThrowsAsync<ForbiddenAccessException>(() => orderService.ConfirmServedAsync(orderId, itemId));
        await Assert.ThrowsAsync<ForbiddenAccessException>(() => orderService.RemakeOrderItemAsync(orderId, itemId));
    }

    [Fact]
    public async Task QrEMenu_AndServiceCall_RequireCheckedInOccupiedTable()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var store = new InMemoryServiceCallStore();
        var menuService = new MenuService(context);
        var callService = new ServiceCallService(context, notifier, store);
        var tableService = new TableService(context, notifier, tableLock: null, serviceCallStore: store);

        var cat = new Category { Name = "Khai vị", IsActive = true };
        var dish = new MenuItem { Name = "Súp Bào Ngư", Price = 350_000m, Category = cat, Status = "Available" };
        var table = new Table { TableNumber = "B-02", Capacity = 4, Status = TableStatus.Available };
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddAsync(dish);
        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        foreach (var status in new[] { TableStatus.Available, TableStatus.LockedForPayment, TableStatus.Reserved, TableStatus.Cleaning })
        {
            table.Status = status;
            await context.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() => menuService.GetTableMenuAsync(table.Id));
            await Assert.ThrowsAsync<InvalidOperationException>(() => callService.CreateServiceCallAsync(table.Id, new ServiceCallDto(table.Id, "Gọi phục vụ")));
        }

        table.Status = TableStatus.Available;
        await context.SaveChangesAsync();

        // Walk-in check-in defaults empty guest name to "Thực khách" (never banned terminology) and sets Occupied
        await tableService.CheckInWalkInAsync(table.Id, new WalkInDto("", "", 2));
        var guest = await context.Guests.SingleAsync();
        Assert.Equal("Thực khách", guest.FullName);

        var menu = await menuService.GetTableMenuAsync(table.Id);
        Assert.Single(menu);

        var callId = await callService.CreateServiceCallAsync(table.Id, new ServiceCallDto(table.Id, "Châm nước"));
        Assert.NotEqual(Guid.Empty, callId);
    }

    [Fact]
    public async Task CreateOrder_BlocksLockedTable_MarksReservationCompleted_AndValidatesTastingMenuStock()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var currentUser = new FakeCurrentUserService { Role = nameof(StaffRole.Waitstaff) };

        var staff = new Staff { FullName = "Trần Thị Mai", Username = "mai_w", Email = "mai@vn.vn", PhoneNumber = "0901", PasswordHash = "pw", Role = StaffRole.Waitstaff };
        var cat = new Category { Name = "Fine Dining" };
        var scallop = new MenuItem { Name = "Sò điệp Hokkaido áp chảo", Price = 390_000m, CourseType = CourseType.Appetizer, Category = cat, Status = "Unavailable" };
        var cod = new MenuItem { Name = "Cá tuyết nướng Miso mật ong", Price = 680_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };
        var setMenu = new TastingMenu { Name = "Set Menu Hải Sản", Price = 1_250_000m, IsActive = true };
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = scallop, CourseType = CourseType.Appetizer, CourseOrder = 1 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = cod, CourseType = CourseType.MainCourse, CourseOrder = 2 });

        var lockedTable = new Table { TableNumber = "B-03", Capacity = 4, Status = TableStatus.LockedForPayment };
        var reservedTable = new Table { TableNumber = "B-05", Capacity = 4, Status = TableStatus.Available };

        await context.Staffs.AddAsync(staff);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(scallop, cod);
        await context.TastingMenus.AddAsync(setMenu);
        await context.Tables.AddRangeAsync(lockedTable, reservedTable);
        await context.SaveChangesAsync();

        var resService = new ReservationService(context, new MockPaymentGateway(), notifier);
        var orderService = new OrderService(context, currentUser, new RecordingKitchenNotifier(), notifier);

        // 1. Cannot create order on LockedForPayment table (deposit unpaid)
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderService.CreateOrderWithCoursesAsync(new CreateOrderDto(lockedTable.Id, Items: new List<OrderItemRequestDto> { new(cod.Id, 2) })));

        // 2. Confirm deposit on B-05 -> Table Reserved, Reservation Confirmed
        var booking = await resService.CreateReservationAsync(new CreateReservationDto("Nguyễn Văn An", "0901234567", "an@vn.vn", reservedTable.Id, DateTime.UtcNow.AddHours(1), 4));
        await resService.ConfirmDepositAsync(new ConfirmDepositDto(booking.BookingCode, "VNP-SET"));

        // 3. Ordering Set Menu containing an Unavailable dish must be blocked naming the dish
        var stockEx = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderService.CreateOrderWithCoursesAsync(new CreateOrderDto(
                reservedTable.Id,
                TastingMenus: new List<OrderTastingMenuRequestDto> { new(setMenu.Id, 4) })));
        Assert.Contains("Sò điệp Hokkaido áp chảo", stockEx.Message);

        // 4. Make dish Available -> Order creation succeeds AND transitions Confirmed reservation to Completed!
        scallop.Status = "Available";
        await context.SaveChangesAsync();

        var orderId = await orderService.CreateOrderWithCoursesAsync(new CreateOrderDto(
            reservedTable.Id,
            TastingMenus: new List<OrderTastingMenuRequestDto> { new(setMenu.Id, 4) }));
        Assert.NotEqual(Guid.Empty, orderId);

        var updatedReservation = await context.Reservations.FindAsync(booking.ReservationId);
        Assert.Equal(ReservationStatus.Completed, updatedReservation!.Status);

        // Guest can no longer cancel online mid-meal to steal a 100% deposit refund
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            resService.CancelReservationAsync(new CancelReservationDto(booking.BookingCode, "Gian lận hủy đơn đang ăn")));
    }

    [Fact]
    public async Task TastingMenu_PartialAndFullCourseCancellation_SyncsHeader_PreviewAndSettlementAccurately()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var currentUser = new FakeCurrentUserService { Role = nameof(StaffRole.Expediter) };

        var expediter = new Staff { FullName = "Lê Minh Quân", Username = "quan_e", Email = "quan@vn.vn", PhoneNumber = "0902", PasswordHash = "pw", Role = StaffRole.Expediter };
        var cat = new Category { Name = "Degustation" };
        var soup = new MenuItem { Name = "Súp bào ngư thượng hạng", Price = 350_000m, CourseType = CourseType.Appetizer, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Bò Wagyu A5 sốt nấm Truffle", Price = 1_250_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };
        var souffle = new MenuItem { Name = "Bánh Soufflé sô-cô-la", Price = 220_000m, CourseType = CourseType.Dessert, Category = cat, Status = "Available" };

        var tasting = new TastingMenu { Name = "Set Menu Thượng Hạng", Price = 1_800_000m, IsActive = true };
        tasting.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = tasting, MenuItem = soup, CourseType = CourseType.Appetizer, CourseOrder = 1 });
        tasting.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = tasting, MenuItem = wagyu, CourseType = CourseType.MainCourse, CourseOrder = 2 });
        tasting.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = tasting, MenuItem = souffle, CourseType = CourseType.Dessert, CourseOrder = 3 });

        var table1 = new Table { TableNumber = "B-05", Capacity = 4, Status = TableStatus.Occupied };
        var table2 = new Table { TableNumber = "B-06", Capacity = 4, Status = TableStatus.Occupied };

        await context.Staffs.AddAsync(expediter);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(soup, wagyu, souffle);
        await context.TastingMenus.AddAsync(tasting);
        await context.Tables.AddRangeAsync(table1, table2);
        await context.SaveChangesAsync();

        currentUser.UserId = expediter.Id;
        var orderSvc = new OrderService(context, currentUser, new RecordingKitchenNotifier(), notifier);
        var invSvc = new InvoiceService(context, currentUser, notifier);

        // Case 1: Serve Appetizer & MainCourse, then cancel Dessert -> only served courses are billed by allocated prices
        var allocated = InvoiceService.AllocateSetMenuUnitPrices(1_800_000m, new[] { 350_000m, 1_250_000m, 220_000m });
        var orderId1 = await orderSvc.CreateOrderWithCoursesAsync(new CreateOrderDto(
            table1.Id,
            TastingMenus: new List<OrderTastingMenuRequestDto> { new(tasting.Id, 4) }));

        // Before any dish is served, RequestCheckout must fail (UC-E4 3a)
        await Assert.ThrowsAsync<InvalidOperationException>(() => invSvc.RequestCheckoutAsync(table1.Id));

        var detail1 = await orderSvc.GetOrderDetailsAsync(orderId1);
        var soupOrderItem = detail1.Items.Single(i => i.MenuItemId == soup.Id);
        var wagyuOrderItem = detail1.Items.Single(i => i.MenuItemId == wagyu.Id);
        var souffleOrderItem = detail1.Items.Single(i => i.MenuItemId == souffle.Id);
        Assert.Equal(allocated[0], soupOrderItem.UnitPrice);
        Assert.Equal(allocated[1], wagyuOrderItem.UnitPrice);
        Assert.Equal(allocated[2], souffleOrderItem.UnitPrice);

        var soupItem1 = soupOrderItem.Id;
        var wagyuItem1 = wagyuOrderItem.Id;
        var souffleItem1 = souffleOrderItem.Id;

        await orderSvc.ConfirmServedAsync(orderId1, soupItem1);

        // RequestCheckout succeeds once Course 1 is served, estimating only served Course 1 subtotal
        await invSvc.RequestCheckoutAsync(table1.Id);
        Assert.Equal(4 * allocated[0], notifier.CheckoutRequests.Single().Subtotal);

        // Mutations are locked while table is PaymentPending until reopened
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderSvc.FireNextCourseAsync(orderId1, new FireCourseDto(CourseType.MainCourse)));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderSvc.AddOrderItemsAsync(orderId1, new AddItemsDto(new List<OrderItemRequestDto> { new(soup.Id, 1) })));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderSvc.CancelOrderItemAsync(orderId1, souffleItem1, "Khách xin bỏ món tráng miệng"));

        var tableSvc = new TableService(context, notifier);
        await tableSvc.UpdateTableStatusAsync(table1.Id, new UpdateTableStatusDto(TableStatus.Occupied));

        await orderSvc.FireNextCourseAsync(orderId1, new FireCourseDto(CourseType.MainCourse));
        await orderSvc.ConfirmServedAsync(orderId1, wagyuItem1);

        // Cancel final Dessert course -> only Course 1 & Course 2 are billed
        await orderSvc.CancelOrderItemAsync(orderId1, souffleItem1, "Khách xin bỏ món tráng miệng");

        var expectedSubtotal = 4 * (allocated[0] + allocated[1]); // 6,329,672
        var expectedServiceCharge = Math.Round(expectedSubtotal * 0.05m, 0, MidpointRounding.AwayFromZero); // 316,484
        var expectedVat = Math.Round((expectedSubtotal + expectedServiceCharge) * 0.10m, 0, MidpointRounding.AwayFromZero); // 664,616
        var expectedTotal = expectedSubtotal + expectedServiceCharge + expectedVat; // 7,310,772

        var preview1 = await invSvc.CalculateInvoiceAsync(table1.Id);
        Assert.False(preview1.HasUnservedItems);
        Assert.Equal(expectedSubtotal, preview1.Subtotal);
        Assert.Equal(expectedServiceCharge, preview1.ServiceCharge);
        Assert.Equal(expectedVat, preview1.VatAmount);
        Assert.Equal(expectedTotal, preview1.FinalAmount);
        Assert.Equal(2, preview1.Items!.Count);
        Assert.Equal(allocated[0], preview1.Items.Single(i => i.MenuItemId == soup.Id).UnitPrice);
        Assert.Equal(allocated[1], preview1.Items.Single(i => i.MenuItemId == wagyu.Id).UnitPrice);

        var print1 = await invSvc.PrintPreBillAsync(table1.Id);
        Assert.Equal(expectedSubtotal, print1.Subtotal);
        Assert.Equal(expectedTotal, print1.FinalAmount);

        var invId1 = await invSvc.SettleInvoiceAsync(table1.Id, new SettleInvoiceDto(orderId1, PaymentMethod.Card, expediter.Id));
        Assert.NotEqual(Guid.Empty, invId1);
        var settled1 = await invSvc.GetInvoiceByIdAsync(invId1);
        Assert.Equal(expectedSubtotal, settled1.Subtotal);
        Assert.Equal(expectedServiceCharge, settled1.ServiceCharge);
        Assert.Equal(expectedVat, settled1.VatAmount);
        Assert.Equal(expectedTotal, settled1.FinalTotal);

        // Cannot cancel items on an already settled order
        await Assert.ThrowsAsync<InvalidOperationException>(() => orderSvc.CancelOrderItemAsync(orderId1, soupItem1));

        // Case 2: All courses of Set Menu cancelled before serving -> Header becomes Cancelled, Subtotal = 0, Settle blocked
        var orderId2 = await orderSvc.CreateOrderWithCoursesAsync(new CreateOrderDto(
            table2.Id,
            TastingMenus: new List<OrderTastingMenuRequestDto> { new(tasting.Id, 2) }));
        var detail2 = await orderSvc.GetOrderDetailsAsync(orderId2);
        foreach (var child in detail2.Items.Where(i => i.MenuItemId != Guid.Empty))
        {
            await orderSvc.CancelOrderItemAsync(orderId2, child.Id, "Khách đổi ý");
        }

        var updatedDetail2 = await orderSvc.GetOrderDetailsAsync(orderId2);
        Assert.All(updatedDetail2.Items, i => Assert.Equal(OrderItemStatus.Cancelled, i.Status));

        var preview2 = await invSvc.CalculateInvoiceAsync(table2.Id);
        Assert.Equal(0m, preview2.Subtotal);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            invSvc.SettleInvoiceAsync(table2.Id, new SettleInvoiceDto(orderId2, PaymentMethod.Cash, expediter.Id)));
    }

    [Fact]
    public async Task TableTransfer_CheckInRelocation_AndStatusTransitions_PreventReservationConflicts()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var callStore = new InMemoryServiceCallStore();
        var tableService = new TableService(context, notifier, tableLock: null, serviceCallStore: callStore);
        var callService = new ServiceCallService(context, notifier, callStore);

        var guest1 = new Guest { FullName = "Guest One", PhoneNumber = "0901111111", Email = "g1@vn.vn" };
        var guest2 = new Guest { FullName = "Guest Two", PhoneNumber = "0902222222", Email = "g2@vn.vn" };
        var tSource = new Table { TableNumber = "B-01", Capacity = 4, Status = TableStatus.Occupied };
        var tConflict = new Table { TableNumber = "B-02", Capacity = 4, Status = TableStatus.Available };
        var tClean = new Table { TableNumber = "B-03", Capacity = 4, Status = TableStatus.Available };
        var tMulti = new Table { TableNumber = "B-04", Capacity = 4, Status = TableStatus.Reserved };

        await context.Guests.AddRangeAsync(guest1, guest2);
        await context.Tables.AddRangeAsync(tSource, tConflict, tClean, tMulti);

        // Upcoming Confirmed reservation in 45 minutes on B-02 (even though current status is Available)
        var upcomingOnB02 = new Reservation
        {
            BookingCode = "VD-UPCOMING",
            GuestId = guest1.Id,
            TableId = tConflict.Id,
            PartySize = 2,
            ReservationTime = DateTime.UtcNow.AddMinutes(45),
            Status = ReservationStatus.Confirmed
        };

        // Two Confirmed reservations on B-04 (early & evening); seating the first onto B-03 must keep B-04 Reserved!
        var resEarly = new Reservation
        {
            BookingCode = "VD-EARLY",
            GuestId = guest1.Id,
            TableId = tMulti.Id,
            PartySize = 2,
            ReservationTime = DateTime.UtcNow.AddMinutes(10),
            Status = ReservationStatus.Confirmed
        };
        var resEvening = new Reservation
        {
            BookingCode = "VD-EVENING",
            GuestId = guest2.Id,
            TableId = tMulti.Id,
            PartySize = 4,
            ReservationTime = DateTime.UtcNow.AddHours(5),
            Status = ReservationStatus.Confirmed
        };

        await context.Reservations.AddRangeAsync(upcomingOnB02, resEarly, resEvening);
        await context.SaveChangesAsync();

        // Active service call on B-01
        await callService.CreateServiceCallAsync(tSource.Id, new ServiceCallDto(tSource.Id, "Đổi dụng cụ"));

        // 1. Transferring B-01 -> B-02 must fail due to 45-min upcoming reservation conflict!
        await Assert.ThrowsAsync<ConflictException>(() =>
            tableService.TransferTableAsync(tSource.Id, new TransferTableDto(tConflict.Id)));

        // 2. Transferring B-01 -> B-03 succeeds AND relocates active service call to B-03!
        await tableService.TransferTableAsync(tSource.Id, new TransferTableDto(tClean.Id));
        var activeCalls = await callService.GetActiveServiceCallsAsync();
        Assert.Single(activeCalls);
        Assert.Equal(tClean.Id, activeCalls[0].TableId);
        Assert.Equal("B-03", activeCalls[0].TableNumber);

        // 3. Clean B-01 -> Available, then check in VD-EARLY onto B-01; B-04 must stay Reserved for VD-EVENING!
        await tableService.UpdateTableStatusAsync(tSource.Id, new UpdateTableStatusDto(TableStatus.Available));
        await tableService.CheckInReservationAsync(tSource.Id, new CheckInDto(BookingCode: "VD-EARLY"));
        Assert.Equal(TableStatus.Occupied, (await context.Tables.FindAsync(tSource.Id))!.Status);
        Assert.Equal(TableStatus.Reserved, (await context.Tables.FindAsync(tMulti.Id))!.Status);

        // 4. Cannot manually reset B-04 from Reserved to Available while VD-EVENING is Confirmed
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            tableService.UpdateTableStatusAsync(tMulti.Id, new UpdateTableStatusDto(TableStatus.Available)));
    }

    [Fact]
    public async Task Feedback_ReportMetrics_AndStaffSelfLockoutGuards_EnforceBusinessInvariants()
    {
        using var context = CreateContext();
        var notifier = new RecordingTableNotifier();
        var hasher = new PasswordHasher<Staff>();

        var admin1 = new Staff { FullName = "Đỗ Hoàng Long", Username = "long_m", Email = "long@vn.vn", PhoneNumber = "0909", PasswordHash = "pw", Role = StaffRole.Admin, IsActive = true };
        var currentUser = new FakeCurrentUserService { UserId = admin1.Id, Role = nameof(StaffRole.Admin) };
        await context.Staffs.AddAsync(admin1);

        var cat = new Category { Name = "Drinks" };
        var water = new MenuItem { Name = "Nước khoáng có ga", Price = 120_000m, CourseType = CourseType.Beverage, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Bò Wagyu A5", Price = 1_250_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };
        var tBooked = new Table { TableNumber = "B-04", Capacity = 4, Status = TableStatus.Available };
        var tUnpaid = new Table { TableNumber = "B-07", Capacity = 4, Status = TableStatus.Occupied };
        var tWalkIn = new Table { TableNumber = "B-08", Capacity = 2, Status = TableStatus.Occupied };

        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(water, wagyu);
        await context.Tables.AddRangeAsync(tBooked, tUnpaid, tWalkIn);
        await context.SaveChangesAsync();

        var resSvc = new ReservationService(context, new MockPaymentGateway(), notifier);
        var orderSvc = new OrderService(context, currentUser, new RecordingKitchenNotifier(), notifier);
        var invSvc = new InvoiceService(context, currentUser, notifier);
        var fbSvc = new FeedbackService(context);
        var staffSvc = new StaffService(context, hasher, currentUser);
        var reportSvc = new ReportService(context);

        // 1. Staff self-lockout & last-admin lockout guards
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            staffSvc.UpdateStatusAsync(admin1.Id, new ToggleStatusDto(false)));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            staffSvc.UpdateStaffAsync(admin1.Id, new UpdateStaffDto("Đỗ Hoàng Long", "long@vn.vn", StaffRole.Waitstaff)));

        // Even an unauthenticated system caller cannot lock or demote the last active Admin
        var systemStaffSvc = new StaffService(context, hasher);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            systemStaffSvc.UpdateStatusAsync(admin1.Id, new ToggleStatusDto(false)));

        // Adding a second active Admin allows locking the second Admin, while Admin1 still cannot self-lock
        var admin2Id = await staffSvc.CreateStaffAsync(new CreateStaffDto("Second Manager", "mgr2", "Pass123", "mgr2@vn.vn", StaffRole.Admin));
        Assert.True(await staffSvc.UpdateStatusAsync(admin2Id, new ToggleStatusDto(false)));

        // 2. Minimum-spend reservation on B-04 (2 guests -> 1,000,000 deposit, orders 2x 120k = 240k -> Gross 277,200 < 1,000,000)
        var booking = await resSvc.CreateReservationAsync(new CreateReservationDto("Min Guest", "0905554444", "min2@vn.vn", tBooked.Id, DateTime.UtcNow.AddHours(2), 2));
        await resSvc.ConfirmDepositAsync(new ConfirmDepositDto(booking.BookingCode, "VNP-B04"));

        // Fake feedback BEFORE dining/payment must be rejected!
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fbSvc.SubmitFeedbackAsync(new SubmitFeedbackDto(Guid.Empty, 5, "Fake early review", booking.ReservationId)));

        var orderBookedId = await orderSvc.CreateOrderWithCoursesAsync(new CreateOrderDto(
            tBooked.Id,
            booking.ReservationId,
            admin1.Id,
            new List<OrderItemRequestDto> { new(water.Id, 2) }));
        var waterItemId = (await orderSvc.GetOrderDetailsAsync(orderBookedId)).Items.Single().Id;
        await orderSvc.ConfirmServedAsync(orderBookedId, waterItemId);

        // Feedback while order is still unpaid must STILL be rejected!
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fbSvc.SubmitFeedbackAsync(new SubmitFeedbackDto(Guid.Empty, 5, "Still unpaid", booking.ReservationId)));

        var paidInvId = await invSvc.SettleInvoiceAsync(tBooked.Id, new SettleInvoiceDto(orderBookedId, PaymentMethod.Cash, admin1.Id));

        // Now feedback succeeds!
        var fbId = await fbSvc.SubmitFeedbackAsync(new SubmitFeedbackDto(paidInvId, 5, "Rất hài lòng"));
        Assert.NotEqual(Guid.Empty, fbId);
        var feedbacks = await fbSvc.GetFeedbacksAsync();
        Assert.Single(feedbacks);
        Assert.Equal(paidInvId, feedbacks[0].InvoiceId);

        // Walk-in paid invoice creates synthetic WALKIN- anchor cleanly, enforces 409 Conflict on duplicate, and does NOT inflate TotalReservations!
        var walkOrderId = await orderSvc.CreateOrderWithCoursesAsync(new CreateOrderDto(tWalkIn.Id, Items: new List<OrderItemRequestDto> { new(water.Id, 1) }));
        var walkItemId = (await orderSvc.GetOrderDetailsAsync(walkOrderId)).Items.Single().Id;
        await orderSvc.ConfirmServedAsync(walkOrderId, walkItemId);
        var walkInvId = await invSvc.SettleInvoiceAsync(tWalkIn.Id, new SettleInvoiceDto(walkOrderId, PaymentMethod.Cash, admin1.Id));
        var walkFbId = await fbSvc.SubmitFeedbackAsync(new SubmitFeedbackDto(walkInvId, 4, "Walk-in hài lòng"));
        Assert.NotEqual(Guid.Empty, walkFbId);
        await Assert.ThrowsAsync<ConflictException>(() =>
            fbSvc.SubmitFeedbackAsync(new SubmitFeedbackDto(walkInvId, 4, "Duplicate walk-in review")));

        // 3. Unsettled order with Served Wagyu on B-07 MUST NOT pollute ReportService TopSellingItems or TotalOrders!
        var unpaidOrderId = await orderSvc.CreateOrderWithCoursesAsync(new CreateOrderDto(tUnpaid.Id, Items: new List<OrderItemRequestDto> { new(wagyu.Id, 3) }, IsPriority: true));
        await orderSvc.FireNextCourseAsync(unpaidOrderId, new FireCourseDto(CourseType.MainCourse));
        var unpaidWagyuItem = (await orderSvc.GetOrderDetailsAsync(unpaidOrderId)).Items.Single().Id;
        await orderSvc.ConfirmServedAsync(unpaidOrderId, unpaidWagyuItem);

        var metrics = await reportSvc.GetMetricsAsync(new DateRangeDto(DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1)));
        // B-04 recognized revenue = Max(277,200, 1,000,000) = 1,000,000 + B-08 Gross (120,000 + 6,000 + 12,600 = 138,600) = 1,138,600
        Assert.Equal(1_138_600m, metrics.TotalRevenue);
        Assert.Equal(2, metrics.TotalOrders); // Only B-04 & B-08 settled orders; excludes B-07 unpaid order!
        Assert.Equal(1, metrics.TotalReservations); // Only real B-04 booking; WALKIN- anchor is excluded!
        Assert.DoesNotContain(metrics.TopSellingItems, x => x.MenuItemName == "Bò Wagyu A5");
        Assert.Equal(4.5, metrics.AverageRating); // Average of 5 (booked) and 4 (walk-in)

        // Future date filter must filter AverageRating to 0.0
        var futureMetrics = await reportSvc.GetMetricsAsync(new DateRangeDto(DateTime.UtcNow.AddDays(5), DateTime.UtcNow.AddDays(6)));
        Assert.Equal(0.0, futureMetrics.AverageRating);
    }

    [Fact]
    public async Task CheckInReservation_WithPreOrderedSetMenu_AutoCreatesOrderFiresFirstCourseAndNotifiesKitchen()
    {
        using var context = CreateContext();
        var tableNotifier = new RecordingTableNotifier();
        var kitchenNotifier = new RecordingKitchenNotifier();
        var waiter = new Staff { FullName = "Trần Thị Mai", Username = "mai_pos", Email = "mai_pos@vn.vn", PhoneNumber = "0901", PasswordHash = "pw", Role = StaffRole.Waitstaff, IsActive = true };
        var currentUser = new FakeCurrentUserService { UserId = waiter.Id, Role = nameof(StaffRole.Waitstaff) };

        var cat = new Category { Name = "Signature" };
        var soup = new MenuItem { Name = "Súp bào ngư thượng hạng", Price = 350_000m, CourseType = CourseType.Appetizer, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Bò Wagyu A5 sốt nấm Truffle", Price = 1_250_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };
        var souffle = new MenuItem { Name = "Bánh Soufflé sô-cô-la", Price = 220_000m, CourseType = CourseType.Dessert, Category = cat, Status = "Available" };

        var setMenu = new TastingMenu { Name = "Set Menu Thượng Hạng", Price = 1_800_000m, IsActive = true };
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = soup, CourseType = CourseType.Appetizer, CourseOrder = 1 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = wagyu, CourseType = CourseType.MainCourse, CourseOrder = 2 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = souffle, CourseType = CourseType.Dessert, CourseOrder = 3 });

        var tableB05 = new Table { TableNumber = "B-05", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available };

        await context.Staffs.AddAsync(waiter);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(soup, wagyu, souffle);
        await context.TastingMenus.AddAsync(setMenu);
        await context.Tables.AddAsync(tableB05);
        await context.SaveChangesAsync();

        var reservationService = new ReservationService(context, new MockPaymentGateway(), tableNotifier);
        var tableService = new TableService(context, tableNotifier, kitchenNotifier: kitchenNotifier, currentUserService: currentUser);
        var orderService = new OrderService(context, currentUser, kitchenNotifier, tableNotifier);

        var booking = await reservationService.CreateReservationAsync(new CreateReservationDto(
            "Nguyễn Văn An",
            "0901234567",
            "an.nguyen@email.com",
            tableB05.Id,
            DateTime.UtcNow.AddHours(2),
            4,
            "Kỷ niệm gia đình",
            setMenu.Id));
        Assert.Equal(2_160_000m, booking.DepositAmount);

        await reservationService.ConfirmDepositAsync(new ConfirmDepositDto(booking.BookingCode, "VNP-7K3Q"));
        await tableService.CheckInReservationAsync(tableB05.Id, new CheckInDto(BookingCode: booking.BookingCode));

        Assert.Equal(1, kitchenNotifier.NewOrderCount);

        var activeOrder = await orderService.GetActiveOrderByTableAsync(tableB05.Id);
        Assert.NotNull(activeOrder);
        Assert.Equal(booking.ReservationId, activeOrder!.ReservationId);
        Assert.Equal(4, activeOrder.Items.Count); // 1 package header + 3 courses

        var header = activeOrder.Items.Single(i => i.MenuItemId == Guid.Empty);
        Assert.Equal(4, header.Quantity);
        Assert.Equal(1_800_000m, header.UnitPrice);
        Assert.Equal("Kỷ niệm gia đình", header.Note);

        var c1 = activeOrder.Items.Single(i => i.MenuItemId == soup.Id);
        var c2 = activeOrder.Items.Single(i => i.MenuItemId == wagyu.Id);
        var c3 = activeOrder.Items.Single(i => i.MenuItemId == souffle.Id);
        Assert.Equal(OrderItemStatus.Preparing, c1.Status);
        Assert.NotNull(c1.FiredAt);
        Assert.Equal(OrderItemStatus.Hold, c2.Status);
        Assert.Equal(OrderItemStatus.Hold, c3.Status);
    }

    [Fact]
    public async Task ReportService_ZoneAndShiftFilters_SegmentRevenueOccupancyAndRatingsAccurately()
    {
        using var context = CreateContext();
        var guest1 = new Guest { FullName = "Khách VIP Trưa", PhoneNumber = "0901112222", Email = "vip@vn.vn" };
        var guest2 = new Guest { FullName = "Khách Sảnh Tối", PhoneNumber = "0903334444", Email = "hall@vn.vn" };
        var staff = new Staff { FullName = "Thu Ngân", Username = "cash_r", Email = "cash@vn.vn", PhoneNumber = "0909", PasswordHash = "pw", Role = StaffRole.Admin, IsActive = true };

        var cat = new Category { Name = "Signature" };
        var lobster = new MenuItem { Name = "Tôm Hùm Bơ Tỏi", Price = 1_000_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };
        var steak = new MenuItem { Name = "Thăn Bò Úc", Price = 500_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };

        var tVipOccupied = new Table { TableNumber = "VIP-01", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Occupied, IsActive = true };
        var tVipFree = new Table { TableNumber = "VIP-02", Capacity = 4, Zone = TableZone.VIP, Status = TableStatus.Available, IsActive = true };
        var tHallFree = new Table { TableNumber = "M-01", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available, IsActive = true };

        // Lunch in Vietnam (UTC+7): 05:00 UTC = 12:00 VN (< 16)
        var lunchUtc = new DateTime(2026, 5, 10, 5, 0, 0, DateTimeKind.Utc);
        // Dinner in Vietnam (UTC+7): 12:00 UTC = 19:00 VN (>= 16)
        var dinnerUtc = new DateTime(2026, 5, 10, 12, 0, 0, DateTimeKind.Utc);

        var resVipLunch = new Reservation
        {
            BookingCode = "VD-VIPLUNCH",
            Guest = guest1,
            Table = tVipOccupied,
            PartySize = 2,
            ReservationTime = lunchUtc,
            Status = ReservationStatus.Completed
        };
        var resHallDinner = new Reservation
        {
            BookingCode = "VD-HALLDINNER",
            Guest = guest2,
            Table = tHallFree,
            PartySize = 2,
            ReservationTime = dinnerUtc,
            Status = ReservationStatus.Completed
        };

        var orderVipLunch = new Order
        {
            Table = tVipOccupied,
            Reservation = resVipLunch,
            CreateBy = staff,
            Status = OrderStatus.Completed,
            OpenedAt = lunchUtc,
            ClosedAt = lunchUtc.AddHours(1)
        };
        orderVipLunch.OrderItems.Add(new OrderItem
        {
            Order = orderVipLunch,
            MenuItem = lobster,
            Quantity = 2,
            UnitPrice = 1_000_000m,
            Status = OrderItemStatus.Served
        });

        var orderHallDinner = new Order
        {
            Table = tHallFree,
            Reservation = resHallDinner,
            CreateBy = staff,
            Status = OrderStatus.Completed,
            OpenedAt = dinnerUtc,
            ClosedAt = dinnerUtc.AddHours(1)
        };
        orderHallDinner.OrderItems.Add(new OrderItem
        {
            Order = orderHallDinner,
            MenuItem = steak,
            Quantity = 1,
            UnitPrice = 500_000m,
            Status = OrderItemStatus.Served
        });

        // VIP Lunch Gross = 2,000,000 + 100,000 + 210,000 = 2,310,000
        var invVipLunch = new Invoice
        {
            Order = orderVipLunch,
            Subtotal = 2_000_000m,
            ServiceCharge = 100_000m,
            VatAmount = 210_000m,
            DeductedDeposit = 1_000_000m,
            PaymentMethod = PaymentMethod.Card,
            IsPaid = true,
            CreatedAt = lunchUtc.AddHours(1),
            SettleBy = staff
        };

        // MainHall Dinner Gross = 500,000 + 25,000 + 52,500 = 577,500
        var invHallDinner = new Invoice
        {
            Order = orderHallDinner,
            Subtotal = 500_000m,
            ServiceCharge = 25_000m,
            VatAmount = 52_500m,
            DeductedDeposit = 0m,
            PaymentMethod = PaymentMethod.Cash,
            IsPaid = true,
            CreatedAt = dinnerUtc.AddHours(1),
            SettleBy = staff
        };

        var fbVipLunch = new Feedback { Reservation = resVipLunch, Rating = 5, Comment = "VIP tuyệt vời", CreatedAt = lunchUtc.AddHours(2) };
        var fbHallDinner = new Feedback { Reservation = resHallDinner, Rating = 3, Comment = "Bình thường", CreatedAt = dinnerUtc.AddHours(2) };

        await context.Guests.AddRangeAsync(guest1, guest2);
        await context.Staffs.AddAsync(staff);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(lobster, steak);
        await context.Tables.AddRangeAsync(tVipOccupied, tVipFree, tHallFree);
        await context.Reservations.AddRangeAsync(resVipLunch, resHallDinner);
        await context.Orders.AddRangeAsync(orderVipLunch, orderHallDinner);
        await context.Invoices.AddRangeAsync(invVipLunch, invHallDinner);
        await context.Feedbacks.AddRangeAsync(fbVipLunch, fbHallDinner);
        await context.SaveChangesAsync();

        var reportSvc = new ReportService(context);

        // 1. Filter by Zone = VIP (1 of 2 VIP tables is Occupied -> 50.0% Occupancy)
        var vipMetrics = await reportSvc.GetMetricsAsync(new DateRangeDto(Zone: TableZone.VIP));
        Assert.Equal(2_310_000m, vipMetrics.TotalRevenue);
        Assert.Equal(1, vipMetrics.TotalOrders);
        Assert.Equal(1, vipMetrics.TotalReservations);
        Assert.Equal(50.0, vipMetrics.OccupancyRate);
        Assert.Equal(5.0, vipMetrics.AverageRating);
        Assert.Single(vipMetrics.TopSellingItems);
        Assert.Equal("Tôm Hùm Bơ Tỏi", vipMetrics.TopSellingItems[0].MenuItemName);

        // 2. Filter by Shift = Dinner (only MainHall dinner order & invoice)
        var dinnerMetrics = await reportSvc.GetMetricsAsync(new DateRangeDto(Shift: "Dinner"));
        Assert.Equal(577_500m, dinnerMetrics.TotalRevenue);
        Assert.Equal(0m, dinnerMetrics.LunchShiftRevenue);
        Assert.Equal(577_500m, dinnerMetrics.DinnerShiftRevenue);
        Assert.Equal(1, dinnerMetrics.TotalOrders);
        Assert.Equal(1, dinnerMetrics.TotalReservations);
        Assert.Equal(3.0, dinnerMetrics.AverageRating);
        Assert.Single(dinnerMetrics.TopSellingItems);
        Assert.Equal("Thăn Bò Úc", dinnerMetrics.TopSellingItems[0].MenuItemName);

        // 3. Invalid shift string throws ArgumentException
        await Assert.ThrowsAsync<ArgumentException>(() =>
            reportSvc.GetMetricsAsync(new DateRangeDto(Shift: "Midnight")));

        // 4. CSV export includes selected Zone and Shift header metadata
        var csvBytes = await reportSvc.ExportRevenueReportAsync(new DateRangeDto(Zone: TableZone.VIP, Shift: "Lunch"));
        var csvText = Encoding.UTF8.GetString(csvBytes);
        Assert.Contains("Khu vuc,VIP,Ca phuc vu,Lunch", csvText);
        Assert.Contains("Tôm Hùm Bơ Tỏi", csvText);
        Assert.DoesNotContain("Thăn Bò Úc", csvText);
    }

    [Fact]
    public async Task B05_SetMenuThuongHang_AllServedAndCourse3Cancelled_MatchesSection10AndOwnerAnswer13()
    {
        using var context = CreateContext();
        var tableNotifier = new RecordingTableNotifier();
        var kitchenNotifier = new RecordingKitchenNotifier();

        var waiter = new Staff { FullName = "Trần Thị Mai", Username = "mai_b05", Email = "mai_b05@vn.vn", PhoneNumber = "0901000001", PasswordHash = "pw", Role = StaffRole.Waitstaff, IsActive = true };
        var expediter = new Staff { FullName = "Lê Minh Quân", Username = "quan_b05", Email = "quan_b05@vn.vn", PhoneNumber = "0901000002", PasswordHash = "pw", Role = StaffRole.Expediter, IsActive = true };
        await context.Staffs.AddRangeAsync(waiter, expediter);

        var cat = new Category { Name = "Thực đơn" };
        var soup = new MenuItem { Name = "Súp bào ngư thượng hạng", Price = 350_000m, CourseType = CourseType.Appetizer, PrepTimeMinutes = 12, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Bò Wagyu A5 sốt nấm Truffle", Price = 1_250_000m, CourseType = CourseType.MainCourse, PrepTimeMinutes = 25, Category = cat, Status = "Available" };
        var souffle = new MenuItem { Name = "Bánh Soufflé sô-cô-la", Price = 220_000m, CourseType = CourseType.Dessert, PrepTimeMinutes = 15, Category = cat, Status = "Available" };

        var setMenu = new TastingMenu { Name = "Set Menu Thượng Hạng", Price = 1_800_000m, IsActive = true };
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = soup, CourseType = CourseType.Appetizer, CourseOrder = 1 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = wagyu, CourseType = CourseType.MainCourse, CourseOrder = 2 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = souffle, CourseType = CourseType.Dessert, CourseOrder = 3 });

        var tableB05All = new Table { TableNumber = "B05", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available };
        var tableB06Cancel = new Table { TableNumber = "B06", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available };

        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(soup, wagyu, souffle);
        await context.TastingMenus.AddAsync(setMenu);
        await context.Tables.AddRangeAsync(tableB05All, tableB06Cancel);
        await context.SaveChangesAsync();

        var currentUser = new FakeCurrentUserService { UserId = waiter.Id, Role = nameof(StaffRole.Waitstaff) };
        var resSvc = new ReservationService(context, new MockPaymentGateway(), tableNotifier);
        var tableSvc = new TableService(context, tableNotifier, kitchenNotifier: kitchenNotifier, currentUserService: currentUser);
        var orderSvc = new OrderService(context, currentUser, kitchenNotifier, tableNotifier);
        var invSvc = new InvoiceService(context, currentUser, tableNotifier);

        // Case A: §10 story B05 with all 3 courses served -> 7.200.000 / 360.000 / 756.000 / 8.316.000 - 2.160.000 = 6.156.000
        var bookingAll = await resSvc.CreateReservationAsync(new CreateReservationDto(
            "Nguyễn Văn An", "0901234567", "an.nguyen@email.com", tableB05All.Id, DateTime.UtcNow.AddHours(2), 4, null, setMenu.Id));
        Assert.Equal(2_160_000m, bookingAll.DepositAmount);
        await resSvc.ConfirmDepositAsync(new ConfirmDepositDto(bookingAll.BookingCode, "VNP-7K3Q-ALL"));
        await tableSvc.CheckInReservationAsync(tableB05All.Id, new CheckInDto(BookingCode: bookingAll.BookingCode));

        var orderAll = await orderSvc.GetActiveOrderByTableAsync(tableB05All.Id);
        Assert.NotNull(orderAll);

        await orderSvc.FireNextCourseAsync(orderAll!.Id, new FireCourseDto(CourseType.MainCourse));
        await orderSvc.FireNextCourseAsync(orderAll.Id, new FireCourseDto(CourseType.Dessert));

        currentUser.UserId = expediter.Id;
        currentUser.Role = nameof(StaffRole.Expediter);
        foreach (var dish in orderAll.Items.Where(i => i.MenuItemId != Guid.Empty))
        {
            await orderSvc.ConfirmServedAsync(orderAll.Id, dish.Id);
        }

        var previewAll = await invSvc.CalculateInvoiceAsync(tableB05All.Id);
        Assert.Equal(7_200_000m, previewAll.Subtotal);
        Assert.Equal(360_000m, previewAll.ServiceCharge);
        Assert.Equal(756_000m, previewAll.VatAmount);
        Assert.Equal(2_160_000m, previewAll.DeductedDeposit);
        Assert.Equal(6_156_000m, previewAll.FinalAmount);

        var printAll = await invSvc.PrintPreBillAsync(tableB05All.Id);
        Assert.Equal(previewAll.Subtotal, printAll.Subtotal);
        Assert.Equal(previewAll.FinalAmount, printAll.FinalAmount);

        var invAllId = await invSvc.SettleInvoiceAsync(tableB05All.Id, new SettleInvoiceDto(orderAll.Id, PaymentMethod.BankTransfer, expediter.Id));
        var settledAll = await invSvc.GetInvoiceByIdAsync(invAllId);
        Assert.Equal(7_200_000m, settledAll.Subtotal);
        Assert.Equal(360_000m, settledAll.ServiceCharge);
        Assert.Equal(756_000m, settledAll.VatAmount);
        Assert.Equal(2_160_000m, settledAll.DeductedDeposit);
        Assert.Equal(6_156_000m, settledAll.FinalTotal);

        // Case B: B05 with Course 3 cancelled -> allocated unit prices of Course 1 & Course 2 only
        currentUser.UserId = waiter.Id;
        currentUser.Role = nameof(StaffRole.Waitstaff);
        var bookingCancelled = await resSvc.CreateReservationAsync(new CreateReservationDto(
            "Nguyễn Văn An", "0901234567", "an.nguyen@email.com", tableB06Cancel.Id, DateTime.UtcNow.AddHours(3), 4, null, setMenu.Id));
        await resSvc.ConfirmDepositAsync(new ConfirmDepositDto(bookingCancelled.BookingCode, "VNP-7K3Q-C3"));
        await tableSvc.CheckInReservationAsync(tableB06Cancel.Id, new CheckInDto(BookingCode: bookingCancelled.BookingCode));

        var orderCancelled = await orderSvc.GetActiveOrderByTableAsync(tableB06Cancel.Id);
        Assert.NotNull(orderCancelled);
        await orderSvc.FireNextCourseAsync(orderCancelled!.Id, new FireCourseDto(CourseType.MainCourse));

        currentUser.UserId = expediter.Id;
        currentUser.Role = nameof(StaffRole.Expediter);
        var c1 = orderCancelled.Items.Single(i => i.MenuItemId == soup.Id);
        var c2 = orderCancelled.Items.Single(i => i.MenuItemId == wagyu.Id);
        var c3 = orderCancelled.Items.Single(i => i.MenuItemId == souffle.Id);
        await orderSvc.ConfirmServedAsync(orderCancelled.Id, c1.Id);
        await orderSvc.ConfirmServedAsync(orderCancelled.Id, c2.Id);
        await orderSvc.CancelOrderItemAsync(orderCancelled.Id, c3.Id, "Khách không dùng tráng miệng");

        var allocated = InvoiceService.AllocateSetMenuUnitPrices(1_800_000m, new[] { 350_000m, 1_250_000m, 220_000m });
        var expectedSub = 4 * (allocated[0] + allocated[1]);
        var expectedSvc = Math.Round(expectedSub * 0.05m, 0, MidpointRounding.AwayFromZero);
        var expectedVat = Math.Round((expectedSub + expectedSvc) * 0.10m, 0, MidpointRounding.AwayFromZero);
        var expectedDue = Math.Max(0m, expectedSub + expectedSvc + expectedVat - 2_160_000m);

        var previewCancelled = await invSvc.CalculateInvoiceAsync(tableB06Cancel.Id);
        Assert.Equal(expectedSub, previewCancelled.Subtotal);
        Assert.Equal(expectedSvc, previewCancelled.ServiceCharge);
        Assert.Equal(expectedVat, previewCancelled.VatAmount);
        Assert.Equal(expectedDue, previewCancelled.FinalAmount);

        var invCancelledId = await invSvc.SettleInvoiceAsync(tableB06Cancel.Id, new SettleInvoiceDto(orderCancelled.Id, PaymentMethod.Card, expediter.Id));
        var settledCancelled = await invSvc.GetInvoiceByIdAsync(invCancelledId);
        Assert.Equal(expectedSub, settledCancelled.Subtotal);
        Assert.Equal(expectedDue, settledCancelled.FinalTotal);
    }

    [Fact]
    public async Task ReportService_PaidB05SetMenuOrder_ExcludesSetHeaderAndSumsDishesTo7_200_000()
    {
        using var context = CreateContext();
        var tableNotifier = new RecordingTableNotifier();
        var kitchenNotifier = new RecordingKitchenNotifier();

        var waiter = new Staff { FullName = "Trần Thị Mai", Username = "mai_rep", Email = "mai_rep@vn.vn", PhoneNumber = "0901000011", PasswordHash = "pw", Role = StaffRole.Waitstaff, IsActive = true };
        var expediter = new Staff { FullName = "Lê Minh Quân", Username = "quan_rep", Email = "quan_rep@vn.vn", PhoneNumber = "0901000012", PasswordHash = "pw", Role = StaffRole.Expediter, IsActive = true };
        await context.Staffs.AddRangeAsync(waiter, expediter);

        var cat = new Category { Name = "Thực đơn" };
        var soup = new MenuItem { Name = "Súp bào ngư thượng hạng", Price = 350_000m, CourseType = CourseType.Appetizer, PrepTimeMinutes = 12, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Bò Wagyu A5 sốt nấm Truffle", Price = 1_250_000m, CourseType = CourseType.MainCourse, PrepTimeMinutes = 25, Category = cat, Status = "Available" };
        var souffle = new MenuItem { Name = "Bánh Soufflé sô-cô-la", Price = 220_000m, CourseType = CourseType.Dessert, PrepTimeMinutes = 15, Category = cat, Status = "Available" };

        var setMenu = new TastingMenu { Name = "Set Menu Thượng Hạng", Price = 1_800_000m, IsActive = true };
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = soup, CourseType = CourseType.Appetizer, CourseOrder = 1 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = wagyu, CourseType = CourseType.MainCourse, CourseOrder = 2 });
        setMenu.TastingMenuItems.Add(new TastingMenuItem { TastingMenu = setMenu, MenuItem = souffle, CourseType = CourseType.Dessert, CourseOrder = 3 });

        var tableB05 = new Table { TableNumber = "B05", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available };

        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(soup, wagyu, souffle);
        await context.TastingMenus.AddAsync(setMenu);
        await context.Tables.AddAsync(tableB05);
        await context.SaveChangesAsync();

        var currentUser = new FakeCurrentUserService { UserId = waiter.Id, Role = nameof(StaffRole.Waitstaff) };
        var resSvc = new ReservationService(context, new MockPaymentGateway(), tableNotifier);
        var tableSvc = new TableService(context, tableNotifier, kitchenNotifier: kitchenNotifier, currentUserService: currentUser);
        var orderSvc = new OrderService(context, currentUser, kitchenNotifier, tableNotifier);
        var invSvc = new InvoiceService(context, currentUser, tableNotifier);

        var booking = await resSvc.CreateReservationAsync(new CreateReservationDto(
            "Nguyễn Văn An", "0901234567", "an.nguyen@email.com", tableB05.Id, DateTime.UtcNow.AddHours(2), 4, null, setMenu.Id));
        await resSvc.ConfirmDepositAsync(new ConfirmDepositDto(booking.BookingCode, "VNP-7K3Q-REP"));
        await tableSvc.CheckInReservationAsync(tableB05.Id, new CheckInDto(BookingCode: booking.BookingCode));

        var activeOrder = await orderSvc.GetActiveOrderByTableAsync(tableB05.Id);
        Assert.NotNull(activeOrder);

        await orderSvc.FireNextCourseAsync(activeOrder!.Id, new FireCourseDto(CourseType.MainCourse));
        await orderSvc.FireNextCourseAsync(activeOrder.Id, new FireCourseDto(CourseType.Dessert));

        currentUser.UserId = expediter.Id;
        currentUser.Role = nameof(StaffRole.Expediter);
        foreach (var dish in activeOrder.Items.Where(i => i.MenuItemId != Guid.Empty))
        {
            await orderSvc.ConfirmServedAsync(activeOrder.Id, dish.Id);
        }

        await invSvc.SettleInvoiceAsync(tableB05.Id, new SettleInvoiceDto(activeOrder.Id, PaymentMethod.BankTransfer, expediter.Id));

        var reportSvc = new ReportService(context);
        var metrics = await reportSvc.GetMetricsAsync(new DateRangeDto());

        Assert.DoesNotContain(metrics.TopSellingItems, item => item.MenuItemName == "Set Menu Thượng Hạng");
        Assert.NotNull(metrics.BestSellers);
        Assert.DoesNotContain(metrics.BestSellers!, item => item.Name == "Set Menu Thượng Hạng");
        Assert.Equal(3, metrics.BestSellers!.Count);
        Assert.Equal(7_200_000m, metrics.BestSellers.Sum(x => x.Revenue));
        Assert.Equal(7_200_000m, metrics.TopSellingItems.Sum(x => x.Revenue));
    }

    [Fact]
    public async Task ReportService_LegacyZeroUnitPriceSetDishes_ResolveAllocatedPricesWithoutHeader()
    {
        using var context = CreateContext();
        var waiter = new Staff { FullName = "Trần Thị Mai", Username = "mai_leg", Email = "mai_leg@vn.vn", PhoneNumber = "0901000013", PasswordHash = "pw", Role = StaffRole.Waitstaff, IsActive = true };
        var cat = new Category { Name = "Thực đơn" };
        var soup = new MenuItem { Name = "Súp bào ngư thượng hạng", Price = 350_000m, CourseType = CourseType.Appetizer, Category = cat, Status = "Available" };
        var wagyu = new MenuItem { Name = "Bò Wagyu A5 sốt nấm Truffle", Price = 1_250_000m, CourseType = CourseType.MainCourse, Category = cat, Status = "Available" };
        var souffle = new MenuItem { Name = "Bánh Soufflé sô-cô-la", Price = 220_000m, CourseType = CourseType.Dessert, Category = cat, Status = "Available" };
        var setMenu = new TastingMenu { Name = "Set Menu Thượng Hạng", Price = 1_800_000m, IsActive = true };
        var table = new Table { TableNumber = "B05", Capacity = 4, Zone = TableZone.MainHall, Status = TableStatus.Available };

        var now = DateTime.UtcNow;
        var order = new Order
        {
            Table = table,
            CreateBy = waiter,
            Status = OrderStatus.Completed,
            OpenedAt = now.AddHours(-1),
            ClosedAt = now,
            OrderItems = new List<OrderItem>
            {
                new() { TastingMenu = setMenu, MenuItemId = null, Quantity = 4, UnitPrice = 1_800_000m, Status = OrderItemStatus.Served, FiredAt = now, ServedAt = now },
                new() { TastingMenu = setMenu, MenuItem = soup, Quantity = 4, UnitPrice = 0m, Status = OrderItemStatus.Served, FiredAt = now, ServedAt = now },
                new() { TastingMenu = setMenu, MenuItem = wagyu, Quantity = 4, UnitPrice = 0m, Status = OrderItemStatus.Served, FiredAt = now, ServedAt = now },
                new() { TastingMenu = setMenu, MenuItem = souffle, Quantity = 4, UnitPrice = 0m, Status = OrderItemStatus.Served, FiredAt = now, ServedAt = now },
            }
        };

        await context.Staffs.AddAsync(waiter);
        await context.Categories.AddAsync(cat);
        await context.MenuItems.AddRangeAsync(soup, wagyu, souffle);
        await context.TastingMenus.AddAsync(setMenu);
        await context.Tables.AddAsync(table);
        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        var reportSvc = new ReportService(context);
        var metrics = await reportSvc.GetMetricsAsync(new DateRangeDto());

        Assert.NotNull(metrics.BestSellers);
        Assert.DoesNotContain(metrics.BestSellers!, item => item.Name == "Set Menu Thượng Hạng");
        Assert.Equal(3, metrics.BestSellers!.Count);
        Assert.Equal(7_200_000m, metrics.BestSellers.Sum(x => x.Revenue));
    }
}
