using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Orders.Commands.ServeOrderItem;

public class ServeOrderItemCommandHandler : IRequestHandler<ServeOrderItemCommand, bool>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IKitchenNotifier _kitchenNotifier;

    public ServeOrderItemCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        IKitchenNotifier kitchenNotifier)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<bool> Handle(ServeOrderItemCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {request.OrderId}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException($"Không thể phục vụ món cho đơn hàng không ở trạng thái đang phục vụ (Processing).");

        var item = order.OrderItems.FirstOrDefault(oi => oi.Id == request.OrderItemId);
        if (item == null)
            throw new KeyNotFoundException($"Không tìm thấy món với mã {request.OrderItemId} trong đơn hàng.");

        if (item.Status == OrderItemStatus.Served)
            return true;

        if (item.Status == OrderItemStatus.Cancelled)
            throw new InvalidOperationException($"Không thể ra món cho đĩa món đã bị hủy.");

        if (item.Status == OrderItemStatus.Hold)
            throw new InvalidOperationException($"Đĩa món đang ở trạng thái Hold, phải kích hoạt CourseFiring chế biến trước khi ra món.");

        var staffId = request.ServedById ?? _currentUserService.UserId;
        item.Status = OrderItemStatus.Served;
        item.ServedById = staffId;
        item.ServedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _kitchenNotifier.NotifyItemServedAsync(
            order.Id,
            order.Table?.TableNumber ?? string.Empty,
            item.Id,
            item.MenuItem?.Name ?? "Món thành phần",
            staffId,
            cancellationToken);

        return true;
    }
}
