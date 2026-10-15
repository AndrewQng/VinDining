using Domain.Entities;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace UnitTests;

public class DbContextModelTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public void Model_ShouldContain_AllDomainEntities()
    {
        using var context = CreateContext();
        var model = context.Model;

        Assert.NotNull(model.FindEntityType(typeof(Staff)));
        Assert.NotNull(model.FindEntityType(typeof(Guest)));
        Assert.NotNull(model.FindEntityType(typeof(Table)));
        Assert.NotNull(model.FindEntityType(typeof(Category)));
        Assert.NotNull(model.FindEntityType(typeof(MenuItem)));
        Assert.NotNull(model.FindEntityType(typeof(Reservation)));
        Assert.NotNull(model.FindEntityType(typeof(Deposit)));
        Assert.NotNull(model.FindEntityType(typeof(Order)));
        Assert.NotNull(model.FindEntityType(typeof(OrderItem)));
        Assert.NotNull(model.FindEntityType(typeof(Invoice)));
        Assert.NotNull(model.FindEntityType(typeof(Feedback)));
        Assert.NotNull(model.FindEntityType(typeof(TastingMenu)));
        Assert.NotNull(model.FindEntityType(typeof(TastingMenuItem)));
    }

    [Fact]
    public void Model_ShouldMapTableNames_Correctly()
    {
        using var context = CreateContext();
        var model = context.Model;

        Assert.Equal("Staffs", model.FindEntityType(typeof(Staff))?.GetTableName());
        Assert.Equal("Guests", model.FindEntityType(typeof(Guest))?.GetTableName());
        Assert.Equal("Tables", model.FindEntityType(typeof(Table))?.GetTableName());
        Assert.Equal("Categories", model.FindEntityType(typeof(Category))?.GetTableName());
        Assert.Equal("MenuItems", model.FindEntityType(typeof(MenuItem))?.GetTableName());
        Assert.Equal("Reservations", model.FindEntityType(typeof(Reservation))?.GetTableName());
        Assert.Equal("Deposits", model.FindEntityType(typeof(Deposit))?.GetTableName());
        Assert.Equal("Orders", model.FindEntityType(typeof(Order))?.GetTableName());
        Assert.Equal("OrderItems", model.FindEntityType(typeof(OrderItem))?.GetTableName());
        Assert.Equal("Invoices", model.FindEntityType(typeof(Invoice))?.GetTableName());
        Assert.Equal("Feedbacks", model.FindEntityType(typeof(Feedback))?.GetTableName());
        Assert.Equal("TastingMenus", model.FindEntityType(typeof(TastingMenu))?.GetTableName());
        Assert.Equal("TastingMenuItems", model.FindEntityType(typeof(TastingMenuItem))?.GetTableName());
    }

    [Fact]
    public void Model_ShouldHave_RequiredUniqueIndexes()
    {
        using var context = CreateContext();
        var model = context.Model;

        // Table.TableNumber unique index
        var tableEntity = model.FindEntityType(typeof(Table));
        var tableNumberIndex = tableEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "TableNumber"));
        Assert.NotNull(tableNumberIndex);
        Assert.True(tableNumberIndex.IsUnique);

        // Staff.Username and Email unique index
        var staffEntity = model.FindEntityType(typeof(Staff));
        var usernameIndex = staffEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "Username"));
        Assert.NotNull(usernameIndex);
        Assert.True(usernameIndex.IsUnique);

        var emailIndex = staffEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "Email"));
        Assert.NotNull(emailIndex);
        Assert.True(emailIndex.IsUnique);

        // Category.Name unique index
        var categoryEntity = model.FindEntityType(typeof(Category));
        var categoryNameIndex = categoryEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "Name"));
        Assert.NotNull(categoryNameIndex);
        Assert.True(categoryNameIndex.IsUnique);

        // Reservation.BookingCode unique index
        var reservationEntity = model.FindEntityType(typeof(Reservation));
        var bookingCodeIndex = reservationEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "BookingCode"));
        Assert.NotNull(bookingCodeIndex);
        Assert.True(bookingCodeIndex.IsUnique);

        // Deposit.ReservationId unique index
        var depositEntity = model.FindEntityType(typeof(Deposit));
        var depositReservationIndex = depositEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "ReservationId"));
        Assert.NotNull(depositReservationIndex);
        Assert.True(depositReservationIndex.IsUnique);

        // Invoice.OrderId unique index
        var invoiceEntity = model.FindEntityType(typeof(Invoice));
        var invoiceOrderIndex = invoiceEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "OrderId"));
        Assert.NotNull(invoiceOrderIndex);
        Assert.True(invoiceOrderIndex.IsUnique);

        // ApplicationUser.StaffId unique index with filter [StaffId] IS NOT NULL
        var userEntity = model.FindEntityType(typeof(ApplicationUser));
        var staffIdIndex = userEntity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "StaffId"));
        Assert.NotNull(staffIdIndex);
        Assert.True(staffIdIndex.IsUnique);
        Assert.Equal("[StaffId] IS NOT NULL", staffIdIndex.GetFilter());
    }

    [Fact]
    public void Model_ShouldConfigure_Feedback_Properly()
    {
        using var context = CreateContext();
        var model = context.Model;

        var feedbackEntity = model.FindEntityType(typeof(Feedback));
        Assert.NotNull(feedbackEntity);

        // ReservationId must be REQUIRED (not nullable)
        var resIdProp = feedbackEntity.FindProperty("ReservationId");
        Assert.NotNull(resIdProp);
        Assert.False(resIdProp.IsNullable);

        // GuestId property must NOT exist
        var guestIdProp = feedbackEntity.FindProperty("GuestId");
        Assert.Null(guestIdProp);

        // ReservationId index must exist
        var resIdIndex = feedbackEntity.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == "ReservationId"));
        Assert.NotNull(resIdIndex);
    }

    [Fact]
    public void Model_ShouldConfigure_ForeignKeys_ToMatchDrawIO()
    {
        using var context = CreateContext();
        var model = context.Model;

        // Order.CreateById -> Staff
        var orderEntity = model.FindEntityType(typeof(Order));
        var createByProp = orderEntity?.FindProperty("CreateById");
        Assert.NotNull(createByProp);
        var createByFk = orderEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == "CreateById"));
        Assert.NotNull(createByFk);
        Assert.Equal(typeof(Staff), createByFk.PrincipalEntityType.ClrType);

        // OrderItem.ServedById -> Staff
        var orderItemEntity = model.FindEntityType(typeof(OrderItem));
        var servedByProp = orderItemEntity?.FindProperty("ServedById");
        Assert.NotNull(servedByProp);
        var servedByFk = orderItemEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == "ServedById"));
        Assert.NotNull(servedByFk);
        Assert.Equal(typeof(Staff), servedByFk.PrincipalEntityType.ClrType);

        // Invoice.SettleById -> Staff
        var invoiceEntity = model.FindEntityType(typeof(Invoice));
        var settleByProp = invoiceEntity?.FindProperty("SettleById");
        Assert.NotNull(settleByProp);
        var settleByFk = invoiceEntity?.GetForeignKeys().FirstOrDefault(fk => fk.Properties.Any(p => p.Name == "SettleById"));
        Assert.NotNull(settleByFk);
        Assert.Equal(typeof(Staff), settleByFk.PrincipalEntityType.ClrType);
    }

    [Fact]
    public void Model_ShouldHave_CompositePerformanceIndexes()
    {
        using var context = CreateContext();
        var model = context.Model;

        // Order (TableId, Status)
        var orderEntity = model.FindEntityType(typeof(Order));
        var orderTableStatusIndex = orderEntity?.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties[0].Name == "TableId" &&
            i.Properties[1].Name == "Status");
        Assert.NotNull(orderTableStatusIndex);

        // MenuItem (CategoryId, Status)
        var menuItemEntity = model.FindEntityType(typeof(MenuItem));
        var menuCatStatusIndex = menuItemEntity?.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties[0].Name == "CategoryId" &&
            i.Properties[1].Name == "Status");
        Assert.NotNull(menuCatStatusIndex);

        // OrderItem (OrderId, Status)
        var orderItemEntity = model.FindEntityType(typeof(OrderItem));
        var orderItemStatusIndex = orderItemEntity?.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties[0].Name == "OrderId" &&
            i.Properties[1].Name == "Status");
        Assert.NotNull(orderItemStatusIndex);

        // Reservation (TableId, ReservationTime)
        var reservationEntity = model.FindEntityType(typeof(Reservation));
        var resTableTimeIndex = reservationEntity?.GetIndexes().FirstOrDefault(i =>
            i.Properties.Count == 2 &&
            i.Properties[0].Name == "TableId" &&
            i.Properties[1].Name == "ReservationTime");
        Assert.NotNull(resTableTimeIndex);
    }
}
