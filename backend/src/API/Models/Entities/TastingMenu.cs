using API.Models.Common;

namespace API.Models.Entities;

public class TastingMenu : BaseEntity, IHasCreatedAt
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TastingMenuItem> TastingMenuItems { get; set; } = new List<TastingMenuItem>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
