using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Orders.Commands.CancelOrderItem;

public class CancelOrderItemCommandHandler : IRequestHandler<CancelOrderItemCommand, bool>
{
    private readonly IApplicationDbContext _dbContext;

    public CancelOrderItemCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(CancelOrderItemCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {request.OrderId}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException($"Không thể hủy món cho đơn hàng không ở trạng thái đang phục vụ (Processing).");

        var item = order.OrderItems.FirstOrDefault(oi => oi.Id == request.OrderItemId);
        if (item == null)
            throw new KeyNotFoundException($"Không tìm thấy món với mã {request.OrderItemId} trong đơn hàng.");

        if (item.Status == OrderItemStatus.Served)
            throw new InvalidOperationException($"Đĩa món đã được phục vụ ra bàn (Served), không thể hủy món.");

        if (item.Status == OrderItemStatus.Cancelled)
            return true;

        item.Status = OrderItemStatus.Cancelled;

        if (!string.IsNullOrWhiteSpace(request.Reason))
        {
            item.Note = string.IsNullOrWhiteSpace(item.Note)
                ? $"[CANCELLED]: {request.Reason}"
                : $"{item.Note} | [CANCELLED]: {request.Reason}";
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
