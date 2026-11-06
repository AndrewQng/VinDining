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
    decimal FinalAmount,
    bool HasUnservedItems = false,
    int UnservedItemCount = 0,
    string? VietQrUrl = null
)
{
    public decimal TotalAmount => FinalAmount;
    public decimal GrossTotal => Subtotal + ServiceCharge + VatAmount;
}

public record InvoicePreviewItemDto(
    string MenuItemName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    Guid OrderItemId = default,
    string Status = "Served"
)
{
    public string ItemName => MenuItemName;
    public decimal LineTotal => TotalPrice;
}

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
)
{
    public decimal TotalAmount => FinalTotal;
}
