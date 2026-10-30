using API.Models.Entities;
using API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API.Data.Configurations;

public class TastingMenuItemConfiguration : IEntityTypeConfiguration<TastingMenuItem>
{
    public void Configure(EntityTypeBuilder<TastingMenuItem> builder)
    {
        builder.ToTable("TastingMenuItems");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.CourseOrder)
            .IsRequired();

        builder.Property(t => t.CourseType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(CourseType.Appetizer)
            .IsRequired();

        builder.HasOne(t => t.TastingMenu)
            .WithMany(m => m.TastingMenuItems)
            .HasForeignKey(t => t.TastingMenuId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.MenuItem)
            .WithMany(m => m.TastingMenuItems)
            .HasForeignKey(t => t.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.TastingMenuId, t.CourseOrder });

        builder.HasIndex(t => t.MenuItemId);
    }
}
