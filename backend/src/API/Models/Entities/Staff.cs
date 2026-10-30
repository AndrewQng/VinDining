using API.Models.Common;
using API.Models.Enums;

namespace API.Models.Entities;

public class Staff : BaseEntity, IHasCreatedAt
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public StaffRole Role { get; set; } = StaffRole.Waitstaff;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Order> OrdersCreated { get; set; } = new List<Order>();
    public ICollection<OrderItem> OrderItemsServed { get; set; } = new List<OrderItem>();
    public ICollection<Invoice> InvoicesSettled { get; set; } = new List<Invoice>();
}
