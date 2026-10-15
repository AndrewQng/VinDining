using System.Reflection;
using Domain.Entities;
using Domain.Enums;
using Xunit;

namespace UnitTests;

public class DomainEntityTests
{
    [Fact]
    public void Staff_ShouldInitializeDefaults_Correctly()
    {
        var staff = new Staff
        {
            FullName = "Nguyen Van A",
            PhoneNumber = "0901234567",
            Username = "staff_a",
            Email = "staff_a@vindining.vn",
            PasswordHash = "hashed_pw",
            Role = StaffRole.Waitstaff
        };

        Assert.NotEqual(Guid.Empty, staff.Id);
        Assert.True(staff.IsActive);
        Assert.Equal(StaffRole.Waitstaff, staff.Role);
        Assert.NotEqual(default, staff.CreatedAt);
        Assert.NotNull(staff.OrdersCreated);
        Assert.NotNull(staff.OrderItemsServed);
        Assert.NotNull(staff.InvoicesSettled);
    }

    [Fact]
    public void Guest_ShouldInitializeProperties_Correctly()
    {
        var guest = new Guest
        {
            FullName = "Tran Thi Guest",
            PhoneNumber = "0987654321",
            Email = "guest@example.com"
        };

        Assert.NotEqual(Guid.Empty, guest.Id);
        Assert.Equal("Tran Thi Guest", guest.FullName);
        Assert.Equal("0987654321", guest.PhoneNumber);
        Assert.Equal("guest@example.com", guest.Email);
        Assert.NotEqual(default, guest.CreatedAt);
        Assert.NotNull(guest.Reservations);
    }

    [Fact]
    public void Table_ShouldInitializeProperties_Correctly()
    {
        var table = new Table
        {
            TableNumber = "T-101",
            Capacity = 4,
            Zone = TableZone.VIP,
            Status = TableStatus.Available
        };

        Assert.NotEqual(Guid.Empty, table.Id);
        Assert.Equal("T-101", table.TableNumber);
        Assert.Equal(4, table.Capacity);
        Assert.Equal(TableZone.VIP, table.Zone);
        Assert.Equal(TableStatus.Available, table.Status);
        Assert.True(table.IsActive);
        Assert.NotEqual(default, table.CreatedAt);
        Assert.NotNull(table.Reservations);
        Assert.NotNull(table.Orders);
    }

    [Fact]
    public void Reservation_ShouldInitializeProperties_Correctly()
    {
        var guestId = Guid.NewGuid();
        var tableId = Guid.NewGuid();
        var resTime = DateTime.UtcNow.AddHours(2);

        var reservation = new Reservation
        {
            BookingCode = "RES-2026-001",
            GuestId = guestId,
            TableId = tableId,
            ReservationTime = resTime,
            PartySize = 4,
            Note = "Quiet corner table",
            Status = ReservationStatus.Pending
        };

        Assert.NotEqual(Guid.Empty, reservation.Id);
        Assert.Equal("RES-2026-001", reservation.BookingCode);
        Assert.Equal(guestId, reservation.GuestId);
        Assert.Equal(tableId, reservation.TableId);
        Assert.Equal(resTime, reservation.ReservationTime);
        Assert.Equal(4, reservation.PartySize);
        Assert.Equal("Quiet corner table", reservation.Note);
        Assert.Equal(ReservationStatus.Pending, reservation.Status);
        Assert.Null(reservation.CancelledAt);
        Assert.Null(reservation.CancelledReason);
        Assert.NotEqual(default, reservation.CreatedAt);
        Assert.NotNull(reservation.Orders);
        Assert.NotNull(reservation.Feedbacks);
    }

    [Fact]
    public void Deposit_ShouldInitializeProperties_Correctly()
    {
        var resId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        var deposit = new Deposit
        {
            ReservationId = resId,
            Amount = 500000m,
            TransactionId = "TXN-12345",
            PaymentMethod = PaymentMethod.BankTransfer,
            Status = DepositStatus.Paid,
            PaidAt = now,
            RefundAmount = null
        };

        Assert.NotEqual(Guid.Empty, deposit.Id);
        Assert.Equal(resId, deposit.ReservationId);
        Assert.Equal(500000m, deposit.Amount);
        Assert.Equal("TXN-12345", deposit.TransactionId);
        Assert.Equal(PaymentMethod.BankTransfer, deposit.PaymentMethod);
        Assert.Equal(DepositStatus.Paid, deposit.Status);
        Assert.Equal(now, deposit.PaidAt);
        Assert.Null(deposit.RefundAmount);
        Assert.NotEqual(default, deposit.CreatedAt);
    }

    [Fact]
    public void Category_ShouldInitializeProperties_Correctly()
    {
        var category = new Category
        {
            Name = "Appetizers",
            Description = "Cold and warm starters"
        };

        Assert.NotEqual(Guid.Empty, category.Id);
        Assert.Equal("Appetizers", category.Name);
        Assert.Equal("Cold and warm starters", category.Description);
        Assert.True(category.IsActive);
        Assert.NotEqual(default, category.CreatedAt);
        Assert.NotNull(category.MenuItems);
    }

    [Fact]
    public void MenuItem_ShouldInitializeProperties_Correctly()
    {
        var catId = Guid.NewGuid();
        var item = new MenuItem
        {
            CategoryId = catId,
            Name = "Beef Wellington",
            Description = "Classic prime tenderloin wrapped in puff pastry",
            Price = 850000m,
            ImageUrl = "https://example.com/beef.jpg",
            Status = "Available"
        };

        Assert.NotEqual(Guid.Empty, item.Id);
        Assert.Equal(catId, item.CategoryId);
        Assert.Equal("Beef Wellington", item.Name);
        Assert.Equal("Classic prime tenderloin wrapped in puff pastry", item.Description);
        Assert.Equal(850000m, item.Price);
        Assert.Equal("https://example.com/beef.jpg", item.ImageUrl);
        Assert.Equal("Available", item.Status);
        Assert.NotEqual(default, item.CreatedAt);
        Assert.NotNull(item.OrderItems);
    }

    [Fact]
    public void Order_ShouldInitializeProperties_Correctly()
    {
        var tableId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var order = new Order
        {
            TableId = tableId,
            CreateById = staffId,
            Status = OrderStatus.Processing
        };

        Assert.NotEqual(Guid.Empty, order.Id);
        Assert.Equal(tableId, order.TableId);
        Assert.Equal(staffId, order.CreateById);
        Assert.Equal(OrderStatus.Processing, order.Status);
        Assert.NotEqual(default, order.OpenedAt);
        Assert.Null(order.ClosedAt);
        Assert.Null(order.ReservationId);
        Assert.NotNull(order.OrderItems);
        Assert.Null(order.Invoice);
    }

    [Fact]
    public void OrderItem_ShouldInitializeProperties_Correctly()
    {
        var orderId = Guid.NewGuid();
        var menuItemId = Guid.NewGuid();
        var item = new OrderItem
        {
            OrderId = orderId,
            MenuItemId = menuItemId,
            Quantity = 2,
            UnitPrice = 450000m,
            Status = OrderItemStatus.Queued,
            Note = "No onions"
        };

        Assert.NotEqual(Guid.Empty, item.Id);
        Assert.Equal(orderId, item.OrderId);
        Assert.Equal(menuItemId, item.MenuItemId);
        Assert.Equal(2, item.Quantity);
        Assert.Equal(450000m, item.UnitPrice);
        Assert.Equal(OrderItemStatus.Queued, item.Status);
        Assert.Equal("No onions", item.Note);
        Assert.Null(item.ServedById);
        Assert.Null(item.ServedAt);
    }

    [Fact]
    public void Invoice_ShouldInitializeProperties_Correctly()
    {
        var orderId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var invoice = new Invoice
        {
            OrderId = orderId,
            SettleById = staffId,
            Subtotal = 1000000m,
            ServiceCharge = 50000m,
            VatAmount = 105000m,
            DeductedDeposit = 200000m,
            PaymentMethod = PaymentMethod.Card,
            IsPaid = true
        };

        Assert.NotEqual(Guid.Empty, invoice.Id);
        Assert.Equal(orderId, invoice.OrderId);
        Assert.Equal(staffId, invoice.SettleById);
        Assert.Equal(1000000m, invoice.Subtotal);
        Assert.Equal(50000m, invoice.ServiceCharge);
        Assert.Equal(105000m, invoice.VatAmount);
        Assert.Equal(200000m, invoice.DeductedDeposit);
        Assert.Equal(PaymentMethod.Card, invoice.PaymentMethod);
        Assert.True(invoice.IsPaid);
        Assert.NotEqual(default, invoice.CreatedAt);
    }

    [Fact]
    public void Feedback_ShouldInitializeProperties_Correctly()
    {
        var resId = Guid.NewGuid();
        var feedback = new Feedback
        {
            ReservationId = resId,
            Rating = 5.0,
            Comment = "Exceptional dining experience!"
        };

        Assert.NotEqual(Guid.Empty, feedback.Id);
        Assert.Equal(resId, feedback.ReservationId);
        Assert.Equal(5.0, feedback.Rating);
        Assert.Equal("Exceptional dining experience!", feedback.Comment);
        Assert.NotEqual(default, feedback.CreatedAt);
    }

    [Fact]
    public void TastingMenu_ShouldInitializeProperties_Correctly()
    {
        var menu = new TastingMenu
        {
            Name = "Chef's Signature 5-Course",
            Description = "A curated seasonal journey",
            Price = 1800000m,
            ImageUrl = "https://example.com/tasting.jpg",
            IsActive = true
        };

        Assert.NotEqual(Guid.Empty, menu.Id);
        Assert.Equal("Chef's Signature 5-Course", menu.Name);
        Assert.Equal("A curated seasonal journey", menu.Description);
        Assert.Equal(1800000m, menu.Price);
        Assert.Equal("https://example.com/tasting.jpg", menu.ImageUrl);
        Assert.True(menu.IsActive);
        Assert.NotEqual(default, menu.CreatedAt);
        Assert.NotNull(menu.TastingMenuItems);
    }

    [Fact]
    public void TastingMenuItem_ShouldInitializeProperties_Correctly()
    {
        var menuId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var item = new TastingMenuItem
        {
            TastingMenuId = menuId,
            MenuItemId = itemId,
            CourseOrder = 1,
            CourseType = CourseType.Appetizer
        };

        Assert.NotEqual(Guid.Empty, item.Id);
        Assert.Equal(menuId, item.TastingMenuId);
        Assert.Equal(itemId, item.MenuItemId);
        Assert.Equal(1, item.CourseOrder);
        Assert.Equal(CourseType.Appetizer, item.CourseType);
    }

    [Fact]
    public void Enums_ShouldContainOnlySpecifiedDrawIOValues()
    {
        // StaffRole: waitstaff, expediter, admin
        var staffRoles = Enum.GetNames<StaffRole>();
        Assert.Equal(3, staffRoles.Length);
        Assert.Contains("Waitstaff", staffRoles);
        Assert.Contains("Expediter", staffRoles);
        Assert.Contains("Admin", staffRoles);

        // PaymentMethod: cash, card, bank_transfer
        var paymentMethods = Enum.GetNames<PaymentMethod>();
        Assert.Equal(3, paymentMethods.Length);
        Assert.Contains("Cash", paymentMethods);
        Assert.Contains("Card", paymentMethods);
        Assert.Contains("BankTransfer", paymentMethods);

        // ReservationStatus: pending, confirmed, completed, cancelled
        var resStatuses = Enum.GetNames<ReservationStatus>();
        Assert.Equal(4, resStatuses.Length);
        Assert.Contains("Pending", resStatuses);
        Assert.Contains("Confirmed", resStatuses);
        Assert.Contains("Completed", resStatuses);
        Assert.Contains("Cancelled", resStatuses);

        // DepositStatus: pending, paid, refunded, forfeited
        var depositStatuses = Enum.GetNames<DepositStatus>();
        Assert.Equal(4, depositStatuses.Length);
        Assert.Contains("Pending", depositStatuses);
        Assert.Contains("Paid", depositStatuses);
        Assert.Contains("Refunded", depositStatuses);
        Assert.Contains("Forfeited", depositStatuses);

        // OrderItemStatus: queued, preparing, served, cancelled
        var orderItemStatuses = Enum.GetNames<OrderItemStatus>();
        Assert.Equal(4, orderItemStatuses.Length);
        Assert.Contains("Queued", orderItemStatuses);
        Assert.Contains("Preparing", orderItemStatuses);
        Assert.Contains("Served", orderItemStatuses);
        Assert.Contains("Cancelled", orderItemStatuses);

        // OrderStatus: processing, completed, cancelled
        var orderStatuses = Enum.GetNames<OrderStatus>();
        Assert.Equal(3, orderStatuses.Length);
        Assert.Contains("Processing", orderStatuses);
        Assert.Contains("Completed", orderStatuses);
        Assert.Contains("Cancelled", orderStatuses);

        // TableStatus: available, locked_for_payment, reserved, occupied, cleaning
        var tableStatuses = Enum.GetNames<TableStatus>();
        Assert.Equal(5, tableStatuses.Length);
        Assert.Contains("Available", tableStatuses);
        Assert.Contains("LockedForPayment", tableStatuses);
        Assert.Contains("Reserved", tableStatuses);
        Assert.Contains("Occupied", tableStatuses);
        Assert.Contains("Cleaning", tableStatuses);

        // TableZone: mainhall, vip, balcony
        var tableZones = Enum.GetNames<TableZone>();
        Assert.Equal(3, tableZones.Length);
        Assert.Contains("MainHall", tableZones);
        Assert.Contains("VIP", tableZones);
        Assert.Contains("Balcony", tableZones);
    }

    [Fact]
    public void StrictSchemaCompliance_ShouldHaveNoArbitraryOrAliasProperties()
    {
        void AssertNoProperty(Type type, string propertyName)
        {
            var prop = type.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
            Assert.True(prop == null, $"Type {type.Name} should NOT contain property {propertyName}");
        }

        // Table should NOT have Name
        AssertNoProperty(typeof(Table), "Name");

        // Guest should NOT have Address or Feedbacks
        AssertNoProperty(typeof(Guest), "Address");
        AssertNoProperty(typeof(Guest), "Feedbacks");

        // Reservation should NOT have DiningShift, SpecialNotes, or CancellationReason
        AssertNoProperty(typeof(Reservation), "DiningShift");
        AssertNoProperty(typeof(Reservation), "SpecialNotes");
        AssertNoProperty(typeof(Reservation), "CancellationReason");

        // Deposit should NOT have RefundedAt or PaymentTime
        AssertNoProperty(typeof(Deposit), "RefundedAt");
        AssertNoProperty(typeof(Deposit), "PaymentTime");

        // Category should NOT have DisplayOrder
        AssertNoProperty(typeof(Category), "DisplayOrder");

        // MenuItem should NOT have AllergyInfo or IsAvailable
        AssertNoProperty(typeof(MenuItem), "AllergyInfo");
        AssertNoProperty(typeof(MenuItem), "IsAvailable");

        // Order should NOT have CreatedByStaffId or CreatedById alias, or CreatedAt
        AssertNoProperty(typeof(Order), "CreatedByStaffId");
        AssertNoProperty(typeof(Order), "CreatedById");
        AssertNoProperty(typeof(Order), "CreatedAt");
        AssertNoProperty(typeof(Order), "CreatedAtUtc");

        // OrderItem should NOT have SpecialNotes, ServedByStaffId, or CreatedAt
        AssertNoProperty(typeof(OrderItem), "SpecialNotes");
        AssertNoProperty(typeof(OrderItem), "ServedByStaffId");
        AssertNoProperty(typeof(OrderItem), "CreatedAt");
        AssertNoProperty(typeof(OrderItem), "CreatedAtUtc");

        // Invoice should NOT have AmountPay, AmountPayable, SettledByStaffId, SettledById, or IssuedAt
        AssertNoProperty(typeof(Invoice), "AmountPay");
        AssertNoProperty(typeof(Invoice), "AmountPayable");
        AssertNoProperty(typeof(Invoice), "SettledByStaffId");
        AssertNoProperty(typeof(Invoice), "SettledById");
        AssertNoProperty(typeof(Invoice), "IssuedAt");

        // Feedback should NOT have GuestId or Guest
        AssertNoProperty(typeof(Feedback), "GuestId");
        AssertNoProperty(typeof(Feedback), "Guest");

        // BaseEntity should NOT have CreatedAtUtc, UpdatedAtUtc, UpdatedAt, IsDeleted
        AssertNoProperty(typeof(Domain.Common.BaseEntity), "CreatedAtUtc");
        AssertNoProperty(typeof(Domain.Common.BaseEntity), "UpdatedAtUtc");
        AssertNoProperty(typeof(Domain.Common.BaseEntity), "UpdatedAt");
        AssertNoProperty(typeof(Domain.Common.BaseEntity), "IsDeleted");
    }
}
