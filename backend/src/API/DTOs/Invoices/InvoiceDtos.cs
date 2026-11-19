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
    string? VietQrUrl = null,
    int GuestCount = 2,
    string? WaiterName = null,
    DateTime? OpenedAt = null,
    DateTime? CheckoutRequestedAt = null,
    Dictionary<string, string>? TastingMenuNames = null
)
{
    public decimal TotalAmount => Subtotal + ServiceCharge + VatAmount;
    public decimal GrossTotal => Subtotal + ServiceCharge + VatAmount;
    public decimal AmountDue => FinalAmount;
    public string VietQrPayload => $"VIETQR|VINDINING|{TableNumber}|{FinalAmount:0}";
}

public record InvoicePreviewItemDto(
    string MenuItemName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    Guid OrderItemId = default,
    string Status = "Served",
    Guid OrderId = default,
    Guid? MenuItemId = null,
    Guid? TastingMenuId = null,
    CourseType CourseType = CourseType.Appetizer,
    string? Note = null,
    bool IsRemake = false,
    int RemakeCount = 0,
    bool IsPriority = false,
    int PrepTimeMinutes = 15,
    DateTime? CookingStartedAt = null,
    DateTime? ServedAt = null,
    Guid? ServedById = null
)
{
    public Guid Id => OrderItemId;
    public string ItemName => MenuItemName;
    public decimal LineTotal => TotalPrice;
}

public record SettleInvoiceDto(
    Guid OrderId = default,
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
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
    DateTime CreatedAt,
    Guid TableId = default,
    Guid SettleById = default,
    string SettleByName = "Thu ngân",
    int? GuestCount = null,
    string? WaiterName = null,
    List<InvoicePreviewItemDto>? Items = null,
    Dictionary<string, string>? TastingMenuNames = null,
    bool IsPaid = true,
    string SurveyToken = "",
    DateTime? SurveySentAt = null
)
{
    public Guid InvoiceId => Id;
    public decimal TotalAmount => Subtotal + ServiceCharge + VatAmount;
    public decimal AmountDue => FinalTotal;
}
