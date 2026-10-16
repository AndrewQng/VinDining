using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Orders.Commands.FireCourse;

public class FireCourseCommandHandler : IRequestHandler<FireCourseCommand, int>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IKitchenNotifier _kitchenNotifier;

    public FireCourseCommandHandler(
        IApplicationDbContext dbContext,
        IKitchenNotifier kitchenNotifier)
    {
        _dbContext = dbContext;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<int> Handle(FireCourseCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {request.OrderId}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException($"Chỉ có thể kích hoạt Course cho đơn hàng đang phục vụ (Processing).");

        // Tìm các món thuộc CourseType chỉ định đang ở trạng thái Hold
        var itemsToFire = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Hold &&
                         oi.MenuItem != null &&
                         oi.MenuItem.CourseType == request.CourseType)
            .ToList();

        if (itemsToFire.Count == 0)
            return 0;

        var now = DateTime.UtcNow;
        foreach (var item in itemsToFire)
        {
            item.Status = OrderItemStatus.Preparing;
            item.FiredAt = now;
            if (request.IsPriority)
            {
                item.IsRush = true;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _kitchenNotifier.NotifyCourseFiredAsync(
            order.Id,
            order.Table?.TableNumber ?? string.Empty,
            request.CourseType,
            cancellationToken);

        return itemsToFire.Count;
    }
}
