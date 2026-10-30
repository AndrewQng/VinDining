using API.Models.Common;
using API.Models.Enums;

namespace API.Models.Entities;

public class TastingMenuItem : BaseEntity
{
    public Guid TastingMenuId { get; set; }
    public TastingMenu TastingMenu { get; set; } = null!;

    public Guid MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;

    public int CourseOrder { get; set; }
    public CourseType CourseType { get; set; }
}
