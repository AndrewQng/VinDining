using API.Models.Entities;
using API.Models.Enums;
using API.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace UnitTests;

public class DbContextCrudTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task EndToEnd_RestaurantDatabaseWorkflow_ShouldSucceed()
    {
        using var context = CreateContext();

        // 1. Create Staff
        var staffWait = new Staff
        {
            FullName = "Tran Van Waiter",
            PhoneNumber = "0911222333",
            Username = "waitstaff_tran",
            Email = "waitstaff@vindining.vn",
            PasswordHash = "hash123",
            Role = StaffRole.Waitstaff
        };

        var staffExpediter = new Staff
        {
            FullName = "Le Thi Expediter",
            PhoneNumber = "0944555666",
            Username = "expediter_le",
            Email = "expediter@vindining.vn",
            PasswordHash = "hash456",
            Role = StaffRole.Expediter
        };

        var staffAdmin = new Staff
        {
            FullName = "Admin Nguyen",
            PhoneNumber = "0977888999",
            Username = "admin_nguyen",
            Email = "admin@vindining.vn",
            PasswordHash = "hash789",
            Role = StaffRole.Admin
        };

        await context.Staffs.AddRangeAsync(staffWait, staffExpediter, staffAdmin);

        // 2. Create Guest (No Address property)
        var guest = new Guest
        {
            FullName = "Pham Gia Khach",
            PhoneNumber = "0988111222",
            Email = "guest@gmail.com"
        };
        await context.Guests.AddAsync(guest);

        // 3. Create Table
        var table = new Table
        {
            TableNumber = "VIP-01",
            Capacity = 6,
            Zone = TableZone.VIP,
            Status = TableStatus.Available
        };
        await context.Tables.AddAsync(table);

        // 4. Create Category (No DisplayOrder) & MenuItem (No AllergyInfo)
        var category = new Category
        {
            Name = "Main Courses",
            Description = "Signature European Dishes"
        };
        await context.Categories.AddAsync(category);

        var menuItem = new MenuItem
        {
            CategoryId = category.Id,
            Category = category,
            Name = "Pan-Seared Foie Gras",
            Description = "Served with caramelized figs and balsamic reduction",
            Price = 650000m,
            Status = "Available"
        };
        await context.MenuItems.AddAsync(menuItem);

        // 5. Create Reservation (No DiningShift, property is Note) & Deposit
        var reservationTime = DateTime.UtcNow.AddHours(3);
        var reservation = new Reservation
        {
            BookingCode = "RES-VD-001",
            GuestId = guest.Id,
            Guest = guest,
            TableId = table.Id,
            Table = table,
            ReservationTime = reservationTime,
            PartySize = 4,
            Status = ReservationStatus.Confirmed,
            Note = "Anniversary celebration"
        };
        await context.Reservations.AddAsync(reservation);

        var deposit = new Deposit
        {
            ReservationId = reservation.Id,
            Reservation = reservation,
            Amount = 500000m,
            TransactionId = "TXN-123456",
            PaymentMethod = PaymentMethod.BankTransfer,
            Status = DepositStatus.Paid,
            PaidAt = DateTime.UtcNow
        };
        await context.Deposits.AddAsync(deposit);

        // 6. Create Order (CreateById FK) and OrderItems (ServedById FK, Note property)
        var order = new Order
        {
            TableId = table.Id,
            Table = table,
            ReservationId = reservation.Id,
            Reservation = reservation,
            CreateById = staffWait.Id,
            CreateBy = staffWait,
            Status = OrderStatus.Processing,
            OpenedAt = DateTime.UtcNow
        };
        await context.Orders.AddAsync(order);

        var orderItem = new OrderItem
        {
            OrderId = order.Id,
            Order = order,
            MenuItemId = menuItem.Id,
            MenuItem = menuItem,
            Quantity = 2,
            UnitPrice = 650000m,
            Status = OrderItemStatus.Served,
            Note = "Medium rare",
            ServedById = staffExpediter.Id,
            ServedBy = staffExpediter,
            ServedAt = DateTime.UtcNow
        };
        await context.OrderItems.AddAsync(orderItem);

        // 7. Settle Order with Invoice (SettleById FK, no AmountPay)
        var subtotal = 1300000m;
        var serviceCharge = 65000m; // 5%
        var vat = 136500m; // 10%
        var deductedDeposit = 500000m;

        var invoice = new Invoice
        {
            OrderId = order.Id,
            Order = order,
            SettleById = staffAdmin.Id,
            SettleBy = staffAdmin,
            Subtotal = subtotal,
            ServiceCharge = serviceCharge,
            VatAmount = vat,
            DeductedDeposit = deductedDeposit,
            PaymentMethod = PaymentMethod.Card,
            IsPaid = true
        };
        await context.Invoices.AddAsync(invoice);

        // 8. Submit Feedback (ReservationId FK, no GuestId)
        var feedback = new Feedback
        {
            ReservationId = reservation.Id,
            Reservation = reservation,
            Rating = 5.0,
            Comment = "Exceptional dining experience and exquisite service!"
        };
        await context.Feedbacks.AddAsync(feedback);

        // Persist all changes
        var savedEntities = await context.SaveChangesAsync();
        Assert.True(savedEntities > 0);

        // 9. Query and Validate Relationships
        var loadedOrder = await context.Orders
            .Include(o => o.Table)
            .Include(o => o.Reservation)
                .ThenInclude(r => r!.Deposit)
            .Include(o => o.CreateBy)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.ServedBy)
            .Include(o => o.Invoice)
                .ThenInclude(i => i!.SettleBy)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        Assert.NotNull(loadedOrder);
        Assert.Equal("VIP-01", loadedOrder.Table.TableNumber);
        Assert.Equal(TableZone.VIP, loadedOrder.Table.Zone);
        Assert.NotNull(loadedOrder.Reservation);
        Assert.Equal("RES-VD-001", loadedOrder.Reservation.BookingCode);
        Assert.Equal("Anniversary celebration", loadedOrder.Reservation.Note);
        Assert.NotNull(loadedOrder.Reservation.Deposit);
        Assert.Equal(500000m, loadedOrder.Reservation.Deposit.Amount);
        Assert.Equal(DepositStatus.Paid, loadedOrder.Reservation.Deposit.Status);
        Assert.Equal("Tran Van Waiter", loadedOrder.CreateBy.FullName);
        Assert.Single(loadedOrder.OrderItems);

        var loadedItem = loadedOrder.OrderItems.First();
        Assert.NotNull(loadedItem.MenuItem);
        Assert.Equal("Pan-Seared Foie Gras", loadedItem.MenuItem.Name);
        Assert.Equal("Medium rare", loadedItem.Note);
        Assert.Equal("Le Thi Expediter", loadedItem.ServedBy?.FullName);

        Assert.NotNull(loadedOrder.Invoice);
        Assert.Equal(1300000m, loadedOrder.Invoice.Subtotal);
        Assert.Equal(500000m, loadedOrder.Invoice.DeductedDeposit);
        Assert.True(loadedOrder.Invoice.IsPaid);
        Assert.Equal("Admin Nguyen", loadedOrder.Invoice.SettleBy.FullName);

        var loadedFeedback = await context.Feedbacks
            .Include(f => f.Reservation)
                .ThenInclude(r => r.Guest)
            .FirstOrDefaultAsync(f => f.ReservationId == reservation.Id);

        Assert.NotNull(loadedFeedback);
        Assert.Equal(5.0, loadedFeedback.Rating);
        Assert.Equal("Pham Gia Khach", loadedFeedback.Reservation.Guest.FullName);
    }

    [Fact]
    public void SaveChanges_Synchronous_ShouldPopulateCreatedAt()
    {
        using var context = CreateContext();

        var category = new Category
        {
            Name = "Beverages",
            Description = "Wine and Cocktails",
            CreatedAt = default
        };

        context.Categories.Add(category);
        context.SaveChanges();

        Assert.NotEqual(default, category.CreatedAt);
    }

    [Fact]
    public async Task SaveChangesAsync_ShouldPopulateCreatedAt()
    {
        using var context = CreateContext();

        var table = new Table
        {
            TableNumber = "BAR-01",
            Capacity = 2,
            Zone = TableZone.Balcony,
            Status = TableStatus.Available,
            CreatedAt = default
        };

        await context.Tables.AddAsync(table);
        await context.SaveChangesAsync();

        Assert.NotEqual(default, table.CreatedAt);
    }

    [Fact]
    public async Task Reservation_CascadeDelete_ShouldDeleteDepositAndFeedbacks()
    {
        using var context = CreateContext();

        var guest = new Guest { FullName = "Guest Test", PhoneNumber = "0901112223", Email = "g@test.vn" };
        var table = new Table { TableNumber = "T-DEL", Capacity = 4 };
        await context.Guests.AddAsync(guest);
        await context.Tables.AddAsync(table);

        var reservation = new Reservation
        {
            BookingCode = "RES-DEL-01",
            GuestId = guest.Id,
            TableId = table.Id,
            ReservationTime = DateTime.UtcNow.AddDays(1),
            PartySize = 2
        };
        await context.Reservations.AddAsync(reservation);

        var deposit = new Deposit
        {
            ReservationId = reservation.Id,
            Amount = 300000m,
            TransactionId = "TX-DEL"
        };
        await context.Deposits.AddAsync(deposit);

        var feedback = new Feedback
        {
            ReservationId = reservation.Id,
            Rating = 4.0,
            Comment = "Good"
        };
        await context.Feedbacks.AddAsync(feedback);

        await context.SaveChangesAsync();

        // Delete reservation
        context.Reservations.Remove(reservation);
        await context.SaveChangesAsync();

        Assert.Null(await context.Reservations.FindAsync(reservation.Id));
        Assert.Null(await context.Deposits.FirstOrDefaultAsync(d => d.ReservationId == reservation.Id));
        Assert.Empty(await context.Feedbacks.Where(f => f.ReservationId == reservation.Id).ToListAsync());
    }

    [Fact]
    public async Task Order_CascadeDelete_ShouldDeleteOrderItems()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "T-CASCADE", Capacity = 4 };
        var category = new Category { Name = "Grill" };
        var menuItem = new MenuItem { Name = "Steak", Category = category, Price = 500000m };
        var staff = new Staff { FullName = "Staff", Username = "staff_casc", Email = "staff_casc@vn.vn", PasswordHash = "pw" };

        await context.Tables.AddAsync(table);
        await context.Categories.AddAsync(category);
        await context.MenuItems.AddAsync(menuItem);
        await context.Staffs.AddAsync(staff);

        var order = new Order
        {
            TableId = table.Id,
            CreateById = staff.Id,
            Status = OrderStatus.Processing
        };
        await context.Orders.AddAsync(order);

        var item1 = new OrderItem { Order = order, MenuItem = menuItem, Quantity = 1, UnitPrice = 500000m };
        var item2 = new OrderItem { Order = order, MenuItem = menuItem, Quantity = 2, UnitPrice = 500000m };
        await context.OrderItems.AddRangeAsync(item1, item2);
        await context.SaveChangesAsync();

        // Remove the parent Order
        context.Orders.Remove(order);
        await context.SaveChangesAsync();

        Assert.Null(await context.Orders.FindAsync(order.Id));
        Assert.Empty(await context.OrderItems.Where(oi => oi.OrderId == order.Id).ToListAsync());
    }

    [Fact]
    public async Task Reservation_CancellationWorkflow_ShouldUpdateFields()
    {
        using var context = CreateContext();

        var guest = new Guest { FullName = "Cancel Guest", PhoneNumber = "0909999000", Email = "cancel@vn.vn" };
        var table = new Table { TableNumber = "T-CANCEL", Capacity = 2 };
        await context.Guests.AddAsync(guest);
        await context.Tables.AddAsync(table);

        var reservation = new Reservation
        {
            BookingCode = "RES-CANCEL-001",
            GuestId = guest.Id,
            TableId = table.Id,
            ReservationTime = DateTime.UtcNow.AddDays(2),
            PartySize = 2,
            Status = ReservationStatus.Pending
        };
        await context.Reservations.AddAsync(reservation);
        await context.SaveChangesAsync();

        // Cancel reservation
        var cancelTime = DateTime.UtcNow;
        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = cancelTime;
        reservation.CancelledReason = "Guest flight cancelled";
        await context.SaveChangesAsync();

        var updated = await context.Reservations.FindAsync(reservation.Id);
        Assert.NotNull(updated);
        Assert.Equal(ReservationStatus.Cancelled, updated.Status);
        Assert.Equal(cancelTime, updated.CancelledAt);
        Assert.Equal("Guest flight cancelled", updated.CancelledReason);
    }

    [Fact]
    public async Task Deposit_RefundWorkflow_ShouldUpdateFields()
    {
        using var context = CreateContext();

        var guest = new Guest { FullName = "Refund Guest", PhoneNumber = "0908888777", Email = "refund@vn.vn" };
        var table = new Table { TableNumber = "T-REFUND", Capacity = 4 };
        await context.Guests.AddAsync(guest);
        await context.Tables.AddAsync(table);

        var reservation = new Reservation
        {
            BookingCode = "RES-REFUND-001",
            GuestId = guest.Id,
            TableId = table.Id,
            ReservationTime = DateTime.UtcNow.AddDays(3),
            PartySize = 4
        };
        await context.Reservations.AddAsync(reservation);

        var deposit = new Deposit
        {
            ReservationId = reservation.Id,
            Amount = 1000000m,
            TransactionId = "TXN-REFUND-01",
            Status = DepositStatus.Paid,
            PaidAt = DateTime.UtcNow
        };
        await context.Deposits.AddAsync(deposit);
        await context.SaveChangesAsync();

        // Process refund
        deposit.Status = DepositStatus.Refunded;
        deposit.RefundAmount = 1000000m;
        await context.SaveChangesAsync();

        var updated = await context.Deposits.FindAsync(deposit.Id);
        Assert.NotNull(updated);
        Assert.Equal(DepositStatus.Refunded, updated.Status);
        Assert.Equal(1000000m, updated.RefundAmount);
    }

    [Fact]
    public async Task Order_WithTastingMenuAndChildCourseItems_ShouldSucceed()
    {
        using var context = CreateContext();

        var table = new Table { TableNumber = "VIP-09", Capacity = 4 };
        var staff = new Staff { FullName = "Server", Username = "server_test", Email = "server@test.vn", PasswordHash = "pw" };
        var category = new Category { Name = "Fine Dining" };
        var soup = new MenuItem { Name = "Lobster Bisque", Price = 300000m, Category = category, CourseType = CourseType.Appetizer };
        var steak = new MenuItem { Name = "Wagyu A5", Price = 1200000m, Category = category, CourseType = CourseType.MainCourse };

        var tastingMenu = new TastingMenu
        {
            Name = "Prestige Autumn Menu",
            Price = 1800000m,
            IsActive = true
        };

        var tmItem1 = new TastingMenuItem { TastingMenu = tastingMenu, MenuItem = soup, CourseOrder = 1, CourseType = CourseType.Appetizer };
        var tmItem2 = new TastingMenuItem { TastingMenu = tastingMenu, MenuItem = steak, CourseOrder = 2, CourseType = CourseType.MainCourse };
        tastingMenu.TastingMenuItems.Add(tmItem1);
        tastingMenu.TastingMenuItems.Add(tmItem2);

        await context.Tables.AddAsync(table);
        await context.Staffs.AddAsync(staff);
        await context.Categories.AddAsync(category);
        await context.MenuItems.AddRangeAsync(soup, steak);
        await context.TastingMenus.AddAsync(tastingMenu);

        var order = new Order { Table = table, CreateBy = staff, Status = OrderStatus.Processing };
        await context.Orders.AddAsync(order);

        // Billing line item: Tasting Menu package price
        var billingLine = new OrderItem
        {
            Order = order,
            TastingMenuId = tastingMenu.Id,
            Quantity = 2,
            UnitPrice = 1800000m,
            Status = OrderItemStatus.Hold
        };
        await context.OrderItems.AddAsync(billingLine);

        // Course items for kitchen orchestration (TastingMenuId linked, UnitPrice = 0)
        var course1 = new OrderItem
        {
            Order = order,
            TastingMenuId = tastingMenu.Id,
            MenuItem = soup,
            Quantity = 2,
            UnitPrice = 0m,
            Status = OrderItemStatus.Hold
        };
        var course2 = new OrderItem
        {
            Order = order,
            TastingMenuId = tastingMenu.Id,
            MenuItem = steak,
            Quantity = 2,
            UnitPrice = 0m,
            Status = OrderItemStatus.Hold
        };
        await context.OrderItems.AddRangeAsync(course1, course2);

        await context.SaveChangesAsync();

        var loadedOrder = await context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        Assert.NotNull(loadedOrder);
        Assert.Equal(3, loadedOrder.OrderItems.Count);

        var loadedBillingLine = loadedOrder.OrderItems.First(oi => oi.MenuItemId == null);
        Assert.Equal("Prestige Autumn Menu", loadedBillingLine.TastingMenu?.Name);
        Assert.Equal(1800000m, loadedBillingLine.UnitPrice);

        var kitchenCourses = loadedOrder.OrderItems.Where(oi => oi.MenuItemId != null).ToList();
        Assert.Equal(2, kitchenCourses.Count);
        Assert.All(kitchenCourses, c => Assert.Equal(0m, c.UnitPrice));
    }
}
