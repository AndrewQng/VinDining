using Application.Common.Interfaces;
using Application.Invoices.Commands.SettleInvoice;
using Application.Invoices.Queries.GetInvoicePreview;
using Application.Orders.Commands.CancelOrderItem;
using Application.Orders.Commands.FireCourse;
using Application.Orders.Commands.RemakeOrderItem;
using Application.Orders.Commands.ServeOrderItem;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace UnitTests;

public class InDiningWorkflowTests
{
    private class FakeKitchenNotifier : IKitchenNotifier
    {
        public List<(Guid OrderId, string TableNumber, CourseType CourseType)> FiredEvents { get; } = new();
        public List<(Guid OrderId, Guid OrderItemId, string Reason)> RemakeEvents { get; } = new();
        public List<(Guid OrderId, Guid OrderItemId, Guid? ServedById)> ServedEvents { get; } = new();

        public Task NotifyNewOrderAsync(Guid orderId, string tableNumber, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task NotifyCourseFiredAsync(Guid orderId, string tableNumber, CourseType courseType, CancellationToken cancellationToken = default)
        {
            FiredEvents.Add((orderId, tableNumber, courseType));
            return Task.CompletedTask;
        }

        public Task NotifyItemRemakeAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, string? reason, CancellationToken cancellationToken = default)
        {
            RemakeEvents.Add((orderId, orderItemId, reason ?? string.Empty));
            return Task.CompletedTask;
        }

        public Task NotifyItemServedAsync(Guid orderId, string tableNumber, Guid orderItemId, string menuItemName, Guid? servedById, CancellationToken cancellationToken = default)
        {
            ServedEvents.Add((orderId, orderItemId, servedById));
            return Task.CompletedTask;
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

    private class FakeCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; } = Guid.NewGuid();
        public string? Email { get; set; } = "waitstaff@vindining.vn";
        public string? Role { get; set; } = "Waitstaff";
        public bool IsAuthenticated => true;
    }

    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private async Task<(Order order, Table table, MenuItem appetizer, MenuItem mainCourse, MenuItem dessert)> SeedTestDataAsync(ApplicationDbContext context)
    {
        var table = new Table
        {
            TableNumber = "VIP-01",
            Capacity = 4,
            Zone = TableZone.VIP,
            Status = TableStatus.Occupied
        };

        var staff = new Staff
        {
            FullName = "Nguyen Phuc Vu",
            PhoneNumber = "0988777666",
            Username = "waitstaff_01",
            Email = "waitstaff01@vindining.vn",
            PasswordHash = "hash123",
            Role = StaffRole.Waitstaff
        };

        var appCategory = new Category { Name = "Appetizer" };
        var mainCategory = new Category { Name = "Main Course" };
        var desCategory = new Category { Name = "Dessert" };

        var appetizer = new MenuItem
        {
            Name = "Súp Bào Ngư",
            Price = 350000m,
            CourseType = CourseType.Appetizer,
            Category = appCategory,
            PrepTimeMinutes = 10
        };

        var mainCourse = new MenuItem
        {
            Name = "Bò Wagyu A5 Nướng Đá",
            Price = 1200000m,
            CourseType = CourseType.MainCourse,
            Category = mainCategory,
            PrepTimeMinutes = 25
        };

        var dessert = new MenuItem
        {
            Name = "Bánh Souffle Socola",
            Price = 200000m,
            CourseType = CourseType.Dessert,
            Category = desCategory,
            PrepTimeMinutes = 15
        };

        var order = new Order
        {
            Table = table,
            CreateBy = staff,
            Status = OrderStatus.Processing,
            OpenedAt = DateTime.UtcNow
        };

        order.OrderItems.Add(new OrderItem
        {
            Order = order,
            MenuItem = appetizer,
            Quantity = 2,
            UnitPrice = appetizer.Price,
            Status = OrderItemStatus.Preparing,
            FiredAt = DateTime.UtcNow
        });

        order.OrderItems.Add(new OrderItem
        {
            Order = order,
            MenuItem = mainCourse,
            Quantity = 2,
            UnitPrice = mainCourse.Price,
            Status = OrderItemStatus.Hold
        });

        order.OrderItems.Add(new OrderItem
        {
            Order = order,
            MenuItem = dessert,
            Quantity = 2,
            UnitPrice = dessert.Price,
            Status = OrderItemStatus.Hold
        });

        await context.Tables.AddAsync(table);
        await context.Staffs.AddAsync(staff);
        await context.MenuItems.AddRangeAsync(appetizer, mainCourse, dessert);
        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        return (order, table, appetizer, mainCourse, dessert);
    }

    [Fact]
    public async Task FireCourse_WhenValid_ShouldSetItemsToPreparingAndSetFiredAt()
    {
        using var context = CreateContext();
        var (order, table, _, mainCourse, _) = await SeedTestDataAsync(context);
        var kitchenNotifier = new FakeKitchenNotifier();

        var handler = new FireCourseCommandHandler(context, kitchenNotifier);
        var command = new FireCourseCommand(order.Id, CourseType.MainCourse, IsPriority: false);

        var firedCount = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(1, firedCount);
        var mainItem = await context.OrderItems.FirstAsync(oi => oi.MenuItemId == mainCourse.Id);
        Assert.Equal(OrderItemStatus.Preparing, mainItem.Status);
        Assert.NotNull(mainItem.FiredAt);
        Assert.False(mainItem.IsRush);

        Assert.Single(kitchenNotifier.FiredEvents);
        Assert.Equal(order.Id, kitchenNotifier.FiredEvents[0].OrderId);
        Assert.Equal(table.TableNumber, kitchenNotifier.FiredEvents[0].TableNumber);
        Assert.Equal(CourseType.MainCourse, kitchenNotifier.FiredEvents[0].CourseType);
    }

    [Fact]
    public async Task FireCourse_WithPriorityFlag_ShouldSetIsRushTrue()
    {
        using var context = CreateContext();
        var (order, _, _, mainCourse, _) = await SeedTestDataAsync(context);
        var kitchenNotifier = new FakeKitchenNotifier();

        var handler = new FireCourseCommandHandler(context, kitchenNotifier);
        var command = new FireCourseCommand(order.Id, CourseType.MainCourse, IsPriority: true);

        await handler.Handle(command, CancellationToken.None);

        var mainItem = await context.OrderItems.FirstAsync(oi => oi.MenuItemId == mainCourse.Id);
        Assert.True(mainItem.IsRush);
    }

    [Fact]
    public async Task FireCourse_WhenOrderNotFound_ShouldThrowKeyNotFoundException()
    {
        using var context = CreateContext();
        var handler = new FireCourseCommandHandler(context, new FakeKitchenNotifier());

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(new FireCourseCommand(Guid.NewGuid(), CourseType.MainCourse), CancellationToken.None));
    }

    [Fact]
    public async Task FireCourse_WhenOrderNotProcessing_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, _, _, _) = await SeedTestDataAsync(context);
        order.Status = OrderStatus.Completed;
        await context.SaveChangesAsync();

        var handler = new FireCourseCommandHandler(context, new FakeKitchenNotifier());
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new FireCourseCommand(order.Id, CourseType.MainCourse), CancellationToken.None));
    }

    [Fact]
    public async Task FireCourse_WhenNoItemsMatchCourse_ShouldReturnZero()
    {
        using var context = CreateContext();
        var (order, _, _, _, _) = await SeedTestDataAsync(context);
        var handler = new FireCourseCommandHandler(context, new FakeKitchenNotifier());

        var result = await handler.Handle(new FireCourseCommand(order.Id, CourseType.Beverage), CancellationToken.None);
        Assert.Equal(0, result);
    }

    [Fact]
    public async Task ServeOrderItem_WhenItemPreparing_ShouldSetServedAndRecordStaffAndTimestamp()
    {
        using var context = CreateContext();
        var (order, _, appetizer, _, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id);
        var kitchenNotifier = new FakeKitchenNotifier();
        var currentUserService = new FakeCurrentUserService();

        var handler = new ServeOrderItemCommandHandler(context, currentUserService, kitchenNotifier);
        var command = new ServeOrderItemCommand(order.Id, item.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result);
        var updatedItem = await context.OrderItems.FirstAsync(oi => oi.Id == item.Id);
        Assert.Equal(OrderItemStatus.Served, updatedItem.Status);
        Assert.Equal(currentUserService.UserId, updatedItem.ServedById);
        Assert.NotNull(updatedItem.ServedAt);

        Assert.Single(kitchenNotifier.ServedEvents);
        Assert.Equal(item.Id, kitchenNotifier.ServedEvents[0].OrderItemId);
    }

    [Fact]
    public async Task ServeOrderItem_WhenItemAlreadyServed_ShouldReturnTrueIdempotently()
    {
        using var context = CreateContext();
        var (order, _, appetizer, _, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id);
        item.Status = OrderItemStatus.Served;
        await context.SaveChangesAsync();

        var handler = new ServeOrderItemCommandHandler(context, new FakeCurrentUserService(), new FakeKitchenNotifier());
        var result = await handler.Handle(new ServeOrderItemCommand(order.Id, item.Id), CancellationToken.None);

        Assert.True(result);
    }

    [Fact]
    public async Task ServeOrderItem_WhenItemHold_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, _, mainCourse, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == mainCourse.Id);

        var handler = new ServeOrderItemCommandHandler(context, new FakeCurrentUserService(), new FakeKitchenNotifier());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new ServeOrderItemCommand(order.Id, item.Id), CancellationToken.None));
    }

    [Fact]
    public async Task ServeOrderItem_WhenItemCancelled_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, appetizer, _, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id);
        item.Status = OrderItemStatus.Cancelled;
        await context.SaveChangesAsync();

        var handler = new ServeOrderItemCommandHandler(context, new FakeCurrentUserService(), new FakeKitchenNotifier());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new ServeOrderItemCommand(order.Id, item.Id), CancellationToken.None));
    }

    [Fact]
    public async Task RemakeOrderItem_WhenValid_ShouldResetToPreparingSetRushAndCallNotifier()
    {
        using var context = CreateContext();
        var (order, _, appetizer, _, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id);
        var kitchenNotifier = new FakeKitchenNotifier();

        var handler = new RemakeOrderItemCommandHandler(context, kitchenNotifier);
        var command = new RemakeOrderItemCommand(order.Id, item.Id, "Đĩa món bị nguội, khách yêu cầu làm lại");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result);
        var updatedItem = await context.OrderItems.FirstAsync(oi => oi.Id == item.Id);
        Assert.Equal(OrderItemStatus.Preparing, updatedItem.Status);
        Assert.True(updatedItem.IsRush);
        Assert.Contains("[REMAKE - RUSH]", updatedItem.Note);

        Assert.Single(kitchenNotifier.RemakeEvents);
        Assert.Equal(item.Id, kitchenNotifier.RemakeEvents[0].OrderItemId);
    }

    [Fact]
    public async Task RemakeOrderItem_WhenItemHold_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, _, mainCourse, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == mainCourse.Id);

        var handler = new RemakeOrderItemCommandHandler(context, new FakeKitchenNotifier());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new RemakeOrderItemCommand(order.Id, item.Id, "Reason"), CancellationToken.None));
    }

    [Fact]
    public async Task CancelOrderItem_WhenValid_ShouldSetCancelled()
    {
        using var context = CreateContext();
        var (order, _, _, mainCourse, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == mainCourse.Id);

        var handler = new CancelOrderItemCommandHandler(context);
        var result = await handler.Handle(new CancelOrderItemCommand(order.Id, item.Id, "Khách đổi ý"), CancellationToken.None);

        Assert.True(result);
        var updatedItem = await context.OrderItems.FirstAsync(oi => oi.Id == item.Id);
        Assert.Equal(OrderItemStatus.Cancelled, updatedItem.Status);
        Assert.Contains("[CANCELLED]", updatedItem.Note);
    }

    [Fact]
    public async Task CancelOrderItem_WhenItemServed_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, appetizer, _, _) = await SeedTestDataAsync(context);
        var item = order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id);
        item.Status = OrderItemStatus.Served;
        await context.SaveChangesAsync();

        var handler = new CancelOrderItemCommandHandler(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new CancelOrderItemCommand(order.Id, item.Id, "Khách không lấy nữa"), CancellationToken.None));
    }

    [Fact]
    public async Task GetInvoicePreview_ShouldCalculateSubtotalServiceChargeVatAndDeductDeposit()
    {
        using var context = CreateContext();
        var (order, table, appetizer, mainCourse, dessert) = await SeedTestDataAsync(context);

        // Giả lập: Appetizer (2 * 350k = 700k) và Main (2 * 1200k = 2400k) đã Served; Dessert hủy
        var appItem = order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id);
        appItem.Status = OrderItemStatus.Served;

        var mainItem = order.OrderItems.First(oi => oi.MenuItemId == mainCourse.Id);
        mainItem.Status = OrderItemStatus.Served;

        var desItem = order.OrderItems.First(oi => oi.MenuItemId == dessert.Id);
        desItem.Status = OrderItemStatus.Cancelled;

        // Gắn Reservation kèm Deposit 500k đã Paid
        var guest = new Guest { FullName = "Le Minh Guest", PhoneNumber = "0900111222", Email = "guest@gmail.com" };
        var res = new Reservation
        {
            Guest = guest,
            Table = table,
            PartySize = 4,
            ReservationTime = DateTime.UtcNow,
            Status = ReservationStatus.Confirmed
        };
        var deposit = new Deposit
        {
            Reservation = res,
            Amount = 500000m,
            TransactionId = "VNPAY123456",
            Status = DepositStatus.Paid,
            PaidAt = DateTime.UtcNow
        };
        res.Deposit = deposit;
        order.Reservation = res;

        await context.Guests.AddAsync(guest);
        await context.Reservations.AddAsync(res);
        await context.Deposits.AddAsync(deposit);
        await context.SaveChangesAsync();

        var handler = new GetInvoicePreviewQueryHandler(context);
        var preview = await handler.Handle(new GetInvoicePreviewQuery(table.Id), CancellationToken.None);

        // Subtotal: 700k + 2400k = 3,100,000
        Assert.Equal(3100000m, preview.Subtotal);

        // Phí phục vụ 5%: 155,000
        Assert.Equal(155000m, preview.ServiceCharge);

        // Thuế VAT 10% tính trên (3,100,000 + 155,000) = 325,500
        Assert.Equal(325500m, preview.VatAmount);

        // Tiền cọc đã cấn trừ: 500,000
        Assert.Equal(500000m, preview.DeductedDeposit);

        // Tổng tiền phải trả: 3,100,000 + 155,000 + 325,500 - 500,000 = 3,080,500
        Assert.Equal(3080500m, preview.TotalAmount);

        // Không còn món unserved vì appetizer và main đã served, dessert đã cancelled
        Assert.False(preview.HasUnservedItems);
        Assert.Equal(0, preview.UnservedItemCount);
    }

    [Fact]
    public async Task GetInvoicePreview_WhenUnservedItemsExist_ShouldSetHasUnservedItemsTrue()
    {
        using var context = CreateContext();
        var (_, table, _, _, _) = await SeedTestDataAsync(context);

        var handler = new GetInvoicePreviewQueryHandler(context);
        var preview = await handler.Handle(new GetInvoicePreviewQuery(table.Id), CancellationToken.None);

        Assert.True(preview.HasUnservedItems);
        // Ban đầu có 1 món Preparing, 2 món Hold = 3 món unserved
        Assert.Equal(3, preview.UnservedItemCount);
    }

    [Fact]
    public async Task SettleInvoice_WhenUnservedItemsExist_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, _, _, _) = await SeedTestDataAsync(context);

        var handler = new SettleInvoiceCommandHandler(context, new FakeCurrentUserService(), new FakeTableNotifier());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new SettleInvoiceCommand(order.Id), CancellationToken.None));

        Assert.Contains("món chưa phục vụ", ex.Message);
    }

    [Fact]
    public async Task SettleInvoice_WhenAllItemsResolved_ShouldCreateInvoiceCompleteOrderAndSetTableCleaning()
    {
        using var context = CreateContext();
        var (order, table, appetizer, mainCourse, dessert) = await SeedTestDataAsync(context);

        // Giải quyết tất cả các món: 2 món Served, 1 món Cancelled
        order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id).Status = OrderItemStatus.Served;
        order.OrderItems.First(oi => oi.MenuItemId == mainCourse.Id).Status = OrderItemStatus.Served;
        order.OrderItems.First(oi => oi.MenuItemId == dessert.Id).Status = OrderItemStatus.Cancelled;

        await context.SaveChangesAsync();

        var tableNotifier = new FakeTableNotifier();
        var currentUserService = new FakeCurrentUserService();
        var handler = new SettleInvoiceCommandHandler(context, currentUserService, tableNotifier);

        var invoiceId = await handler.Handle(new SettleInvoiceCommand(order.Id, PaymentMethod.Card), CancellationToken.None);

        Assert.NotEqual(Guid.Empty, invoiceId);

        // Kiểm tra Invoice
        var invoice = await context.Invoices.FirstAsync(i => i.Id == invoiceId);
        Assert.True(invoice.IsPaid);
        Assert.Equal(PaymentMethod.Card, invoice.PaymentMethod);
        Assert.Equal(3100000m, invoice.Subtotal);
        Assert.Equal(155000m, invoice.ServiceCharge);
        Assert.Equal(325500m, invoice.VatAmount);

        // Kiểm tra Order
        var updatedOrder = await context.Orders.FirstAsync(o => o.Id == order.Id);
        Assert.Equal(OrderStatus.Completed, updatedOrder.Status);
        Assert.NotNull(updatedOrder.ClosedAt);

        // Kiểm tra Table chuyển sang Cleaning
        var updatedTable = await context.Tables.FirstAsync(t => t.Id == table.Id);
        Assert.Equal(TableStatus.Cleaning, updatedTable.Status);

        // Kiểm tra thông báo SignalR sơ đồ bàn
        Assert.Single(tableNotifier.TableStatusEvents);
        Assert.Equal(table.Id, tableNotifier.TableStatusEvents[0].TableId);
        Assert.Equal(TableStatus.Cleaning, tableNotifier.TableStatusEvents[0].Status);
    }

    [Fact]
    public async Task SettleInvoice_WhenAlreadySettled_ShouldThrowInvalidOperationException()
    {
        using var context = CreateContext();
        var (order, _, appetizer, mainCourse, dessert) = await SeedTestDataAsync(context);

        order.OrderItems.First(oi => oi.MenuItemId == appetizer.Id).Status = OrderItemStatus.Served;
        order.OrderItems.First(oi => oi.MenuItemId == mainCourse.Id).Status = OrderItemStatus.Served;
        order.OrderItems.First(oi => oi.MenuItemId == dessert.Id).Status = OrderItemStatus.Cancelled;

        await context.SaveChangesAsync();

        var handler = new SettleInvoiceCommandHandler(context, new FakeCurrentUserService(), new FakeTableNotifier());
        await handler.Handle(new SettleInvoiceCommand(order.Id), CancellationToken.None);

        // Cố gắng thanh toán lần 2
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new SettleInvoiceCommand(order.Id), CancellationToken.None));
    }
}
