namespace API.DTOs;

public record InvoicePreviewDto(
    Guid OrderId,
    Guid TableId,
    string TableNumber,
    List<InvoicePreviewItemDto> Items,
    decimal Subtotal,
    decimal ServiceCharge,
    decimal VatAmount,
    decimal DeductedDeposit,
    decimal FinalAmount
);

public record InvoicePreviewItemDto(
    string MenuItemName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice
);

public record SettleInvoiceDto(
    Guid OrderId,
    PaymentMethod PaymentMethod,
    Guid? StaffId = null
);

public record InvoiceDto(
    Guid Id,
    Guid OrderId,
    string TableNumber,
    decimal Subtotal,
    decimal ServiceCharge,
    decimal VatAmount,
    decimal DeductedDeposit,
    decimal FinalTotal,
    PaymentMethod PaymentMethod,
    DateTime CreatedAt
);
