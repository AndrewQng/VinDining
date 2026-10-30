using API.Models.Common;
using API.Models.Enums;

namespace API.Models.Entities;

public class MenuItem : BaseEntity, IHasCreatedAt
{
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Available";
    public int PrepTimeMinutes { get; set; } = 15;
    public CourseType CourseType { get; set; } = CourseType.Appetizer;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<TastingMenuItem> TastingMenuItems { get; set; } = new List<TastingMenuItem>();
}
