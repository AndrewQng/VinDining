using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("MenuItems");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(m => m.Description)
            .HasMaxLength(1000);

        builder.Property(m => m.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(m => m.ImageUrl)
            .HasMaxLength(500);

        builder.Property(m => m.Status)
            .HasMaxLength(50)
            .HasDefaultValue("Available")
            .IsRequired();

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        builder.HasOne(m => m.Category)
            .WithMany(c => c.MenuItems)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.CategoryId);

        builder.HasIndex(m => m.Name);

        builder.HasIndex(m => m.Status);

        builder.HasIndex(m => new { m.CategoryId, m.Status });
    }
}
