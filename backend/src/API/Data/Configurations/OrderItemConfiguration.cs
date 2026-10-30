using API.Models.Entities;
using API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API.Data.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");

        builder.HasKey(oi => oi.Id);

        builder.Property(oi => oi.Quantity)
            .IsRequired();

        builder.Property(oi => oi.UnitPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(oi => oi.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(OrderItemStatus.Hold)
            .IsRequired();

        builder.Property(oi => oi.Note)
            .HasMaxLength(500);

        builder.HasOne(oi => oi.Order)
            .WithMany(o => o.OrderItems)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(oi => oi.MenuItem)
            .WithMany(m => m.OrderItems)
            .HasForeignKey(oi => oi.MenuItemId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(oi => oi.TastingMenu)
            .WithMany(tm => tm.OrderItems)
            .HasForeignKey(oi => oi.TastingMenuId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(oi => oi.ServedBy)
            .WithMany(s => s.OrderItemsServed)
            .HasForeignKey(oi => oi.ServedById)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(oi => oi.OrderId);

        builder.HasIndex(oi => oi.MenuItemId);

        builder.HasIndex(oi => oi.TastingMenuId);

        builder.HasIndex(oi => oi.ServedById);

        builder.HasIndex(oi => oi.Status);

        builder.HasIndex(oi => new { oi.OrderId, oi.Status });
    }
}
