using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Orders.Commands.RemakeOrderItem;

public class RemakeOrderItemCommandHandler : IRequestHandler<RemakeOrderItemCommand, bool>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IKitchenNotifier _kitchenNotifier;

    public RemakeOrderItemCommandHandler(
        IApplicationDbContext dbContext,
        IKitchenNotifier kitchenNotifier)
    {
        _dbContext = dbContext;
        _kitchenNotifier = kitchenNotifier;
    }

    public async Task<bool> Handle(RemakeOrderItemCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {request.OrderId}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException($"Không thể yêu cầu làm lại món cho đơn hàng không ở trạng thái đang phục vụ (Processing).");

        var item = order.OrderItems.FirstOrDefault(oi => oi.Id == request.OrderItemId);
        if (item == null)
            throw new KeyNotFoundException($"Không tìm thấy món với mã {request.OrderItemId} trong đơn hàng.");

        if (item.Status == OrderItemStatus.Cancelled)
            throw new InvalidOperationException($"Không thể yêu cầu làm lại cho đĩa món đã bị hủy.");

        if (item.Status == OrderItemStatus.Hold)
            throw new InvalidOperationException($"Đĩa món đang ở trạng thái Hold, chưa từng chế biến nên không thể yêu cầu làm lại.");

        // Reset trạng thái về Preparing, đánh dấu Rush khẩn cấp
        item.Status = OrderItemStatus.Preparing;
        item.IsRush = true;
        item.FiredAt = DateTime.UtcNow;
        item.ServedById = null;
        item.ServedAt = null;

        if (!string.IsNullOrWhiteSpace(request.Reason))
        {
            item.Note = string.IsNullOrWhiteSpace(item.Note)
                ? $"[REMAKE - RUSH]: {request.Reason}"
                : $"{item.Note} | [REMAKE - RUSH]: {request.Reason}";
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        await _kitchenNotifier.NotifyItemRemakeAsync(
            order.Id,
            order.Table?.TableNumber ?? string.Empty,
            item.Id,
            item.MenuItem?.Name ?? "Món thành phần",
            request.Reason,
            cancellationToken);

        return true;
    }
}
