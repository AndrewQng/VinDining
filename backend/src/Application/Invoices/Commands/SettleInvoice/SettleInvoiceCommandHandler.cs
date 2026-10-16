using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Invoices.Commands.SettleInvoice;

public class SettleInvoiceCommandHandler : IRequestHandler<SettleInvoiceCommand, Guid>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITableNotifier _tableNotifier;

    public SettleInvoiceCommandHandler(
        IApplicationDbContext dbContext,
        ICurrentUserService currentUserService,
        ITableNotifier tableNotifier)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _tableNotifier = tableNotifier;
    }

    public async Task<Guid> Handle(SettleInvoiceCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Table)
            .Include(o => o.Reservation)
                .ThenInclude(r => r!.Deposit)
            .Include(o => o.OrderItems)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng với mã {request.OrderId}.");

        if (order.Status != OrderStatus.Processing)
            throw new InvalidOperationException($"Chỉ có thể thanh toán đơn hàng đang phục vụ (Processing).");

        if (order.Invoice != null)
            throw new InvalidOperationException($"Đơn hàng này đã có hóa đơn thanh toán.");

        // Kiểm tra chặn thanh toán nếu còn món chưa phục vụ (Hold hoặc Preparing)
        var unservedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Hold || oi.Status == OrderItemStatus.Preparing)
            .ToList();

        if (unservedItems.Count != 0)
        {
            throw new InvalidOperationException(
                $"Không thể thanh toán: Đơn hàng còn {unservedItems.Count} món chưa phục vụ (trạng thái Hold hoặc Preparing). Vui lòng xác nhận hủy món hoặc hoàn tất ra món trước khi xuất hóa đơn.");
        }

        // Tính toán số liệu hóa đơn
        var servedItems = order.OrderItems
            .Where(oi => oi.Status == OrderItemStatus.Served)
            .ToList();

        var subtotal = servedItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var serviceCharge = Math.Round(subtotal * 0.05m, 2);
        var vatAmount = Math.Round((subtotal + serviceCharge) * 0.10m, 2);

        var deductedDeposit = 0m;
        if (order.Reservation?.Deposit != null && order.Reservation.Deposit.Status == DepositStatus.Paid)
        {
            deductedDeposit = order.Reservation.Deposit.Amount;
        }

        var settleById = request.StaffId ?? _currentUserService.UserId ?? order.CreateById;

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            SettleById = settleById,
            Subtotal = subtotal,
            ServiceCharge = serviceCharge,
            VatAmount = vatAmount,
            DeductedDeposit = deductedDeposit,
            PaymentMethod = request.PaymentMethod,
            IsPaid = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Invoices.Add(invoice);

        // Đóng đơn hàng và chuyển bàn sang chờ dọn dẹp (Cleaning)
        order.Status = OrderStatus.Completed;
        order.ClosedAt = DateTime.UtcNow;

        if (order.Table != null)
        {
            order.Table.Status = TableStatus.Cleaning;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        if (order.Table != null)
        {
            await _tableNotifier.NotifyTableStatusChangedAsync(
                order.Table.Id,
                order.Table.TableNumber,
                TableStatus.Cleaning,
                cancellationToken);
        }

        return invoice.Id;
    }
}
