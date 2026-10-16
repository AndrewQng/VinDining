using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Invoices.Queries.GetInvoicePreview;

public class GetInvoicePreviewQueryHandler : IRequestHandler<GetInvoicePreviewQuery, InvoicePreviewDto>
{
    private readonly IApplicationDbContext _dbContext;

    public GetInvoicePreviewQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<InvoicePreviewDto> Handle(GetInvoicePreviewQuery request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Table)
            .Include(o => o.Reservation)
                .ThenInclude(r => r!.Deposit)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.TastingMenu)
            .Where(o => o.TableId == request.TableId && o.Status == OrderStatus.Processing)
            .OrderByDescending(o => o.OpenedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng đang hoạt động (Processing) cho bàn {request.TableId}.");

        // Các món được phục vụ hợp lệ để tính tiền
        var servedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served)
            .ToList();

        // Kiểm tra món chưa phục vụ (Hold hoặc Preparing)
        var unservedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Hold || oi.Status == OrderItemStatus.Preparing)
            .ToList();

        var subtotal = servedItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * 0.05m, 2);
        var vatAmount = Math.Round((subtotal + serviceCharge) * 0.10m, 2);

        var deductedDeposit = 0m;
        if (order.Reservation?.Deposit != null && order.Reservation.Deposit.Status == DepositStatus.Paid)
        {
            deductedDeposit = order.Reservation.Deposit.Amount;
        }

        var totalAmount = Math.Max(0m, subtotal + serviceCharge + vatAmount - deductedDeposit);

        var itemDtos = order.OrderItems.Select(oi => new InvoiceItemDto
        {
            OrderItemId = oi.Id,
            ItemName = oi.MenuItem?.Name ?? oi.TastingMenu?.Name ?? "Món thành phần",
            Quantity = oi.Quantity,
            UnitPrice = oi.UnitPrice,
            Status = oi.Status.ToString()
        }).ToList();

        return new InvoicePreviewDto
        {
            OrderId = order.Id,
            TableId = order.TableId,
            TableNumber = order.Table?.TableNumber ?? string.Empty,
            Subtotal = subtotal,
            ServiceCharge = serviceCharge,
            VatAmount = vatAmount,
            DeductedDeposit = deductedDeposit,
            TotalAmount = totalAmount,
            HasUnservedItems = unservedItems.Count != 0,
            UnservedItemCount = unservedItems.Count,
            Items = itemDtos
        };
    }
}
