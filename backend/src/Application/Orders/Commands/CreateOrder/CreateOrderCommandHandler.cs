using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IKitchenNotifier _kitchenNotifier;

    public CreateOrderCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        IKitchenNotifier kitchenNotifier)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra bàn tồn tại
        var table = await _dbContext.Tables
            .FirstOrDefaultAsync(t => t.Id == request.TableId, cancellationToken);

        if (table == null)
            throw new KeyNotFoundException($"Không tìm thấy bàn với mã {request.TableId}.");

        // 2. Kiểm tra nghiệp vụ Domain: Bàn đang dọn dẹp thì không được nhận khách/gọi món
        if (table.Status == TableStatus.Cleaning)
            throw new InvalidOperationException($"Bàn {table.TableNumber} đang dọn dẹp, vui lòng chọn bàn khác.");

        // 3. Xác định nhân viên phụ trách tạo đơn
        var staffId = request.StaffId ?? _currentUserService.UserId;
        if (!staffId.HasValue || staffId == Guid.Empty)
        {
            var defaultStaff = await _dbContext.Staffs.FirstOrDefaultAsync(s => s.IsActive, cancellationToken);
            staffId = defaultStaff?.Id ?? Guid.NewGuid();
        }

        // 4. Lấy danh sách món ăn từ CSDL để chốt giá thực tế (không tin cậy giá client gửi lên)
        var requestedItemIds = request.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _dbContext.MenuItems
            .Where(m => requestedItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, cancellationToken);

        if (menuItems.Count != requestedItemIds.Count)
            throw new KeyNotFoundException("Một số món ăn không tồn tại trong thực đơn hiện hành.");

        // 5. Tạo đối tượng Order và các OrderItem tương ứng
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TableId = table.Id,
            ReservationId = request.ReservationId,
            CreateById = staffId.Value,
            Status = OrderStatus.Processing,
            OpenedAt = DateTime.UtcNow
        };

        // Xác định Course đầu tiên trong đơn (không tính đồ uống) để kích hoạt nấu ngay
        var foodCourses = menuItems.Values
            .Where(m => m.CourseType != CourseType.Beverage)
            .Select(m => m.CourseType)
            .ToList();

        var firstCourse = foodCourses.Count != 0
            ? foodCourses.Min()
            : CourseType.Appetizer;

        foreach (var itemDto in request.Items)
        {
            var menuItem = menuItems[itemDto.MenuItemId];

            // Món thuộc Course đầu tiên hoặc Đồ uống chuyển thẳng sang Preparing, các Course sau ở trạng thái Hold
            var isImmediate = menuItem.CourseType == CourseType.Beverage || menuItem.CourseType == firstCourse;
            var initialStatus = isImmediate ? OrderItemStatus.Preparing : OrderItemStatus.Hold;
            var firedAt = isImmediate ? DateTime.UtcNow : (DateTime?)null;

            order.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                Quantity = itemDto.Quantity,
                UnitPrice = menuItem.Price,
                Status = initialStatus,
                FiredAt = firedAt,
                Note = itemDto.Note
            });
        }

        // 6. Cập nhật trạng thái bàn sang Có khách (Occupied)
        table.Status = TableStatus.Occupied;

        // 7. Lưu thay đổi vào Cơ sở dữ liệu thông qua EF Core
        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // 8. Bắn thông báo Real-time qua SignalR tới Màn hình Bếp KDS
        await _kitchenNotifier.NotifyNewOrderAsync(order.Id, table.TableNumber, cancellationToken);

        return order.Id;
    }
}
