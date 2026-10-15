using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TastingMenuConfiguration : IEntityTypeConfiguration<TastingMenu>
{
    public void Configure(EntityTypeBuilder<TastingMenu> builder)
    {
        builder.ToTable("TastingMenus");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(1000);

        builder.Property(t => t.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(t => t.ImageUrl)
            .HasMaxLength(500);

        builder.Property(t => t.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        builder.HasIndex(t => t.Name);

        builder.HasIndex(t => t.IsActive);
    }
}
