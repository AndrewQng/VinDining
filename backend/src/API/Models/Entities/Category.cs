using API.Models.Common;

namespace API.Models.Entities;

public class Category : BaseEntity, IHasCreatedAt
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
}
