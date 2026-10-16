namespace Application.Invoices.Queries.GetInvoicePreview;

public class InvoicePreviewDto
{
    public Guid OrderId { get; set; }
    public Guid TableId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ServiceCharge { get; set; }
    public decimal VatAmount { get; set; }
    public decimal DeductedDeposit { get; set; }
    public decimal TotalAmount { get; set; }
    public bool HasUnservedItems { get; set; }
    public int UnservedItemCount { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public class InvoiceItemDto
{
    public Guid OrderItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal => Quantity * UnitPrice;
    public string Status { get; set; } = string.Empty;
}
