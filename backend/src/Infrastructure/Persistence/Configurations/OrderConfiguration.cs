using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(OrderStatus.Processing)
            .IsRequired();

        builder.Property(o => o.IsPriority)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(o => o.OpenedAt)
            .IsRequired();

        builder.HasOne(o => o.Table)
            .WithMany(t => t.Orders)
            .HasForeignKey(o => o.TableId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Reservation)
            .WithMany(r => r.Orders)
            .HasForeignKey(o => o.ReservationId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.CreateBy)
            .WithMany(s => s.OrdersCreated)
            .HasForeignKey(o => o.CreateById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(o => o.TableId);

        builder.HasIndex(o => o.ReservationId);

        builder.HasIndex(o => o.CreateById);

        builder.HasIndex(o => o.Status);

        builder.HasIndex(o => new { o.TableId, o.Status });
    }
}
