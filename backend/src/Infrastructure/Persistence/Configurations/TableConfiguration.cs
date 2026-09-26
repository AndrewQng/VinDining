using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TableConfiguration : IEntityTypeConfiguration<Table>
{
    public void Configure(EntityTypeBuilder<Table> builder)
    {
        builder.ToTable("Tables");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TableNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.Capacity)
            .IsRequired();

        builder.Property(t => t.Zone)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(TableZone.MainHall)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(TableStatus.Available)
            .IsRequired();

        builder.Property(t => t.IsActive)
            .HasDefaultValue(true);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        builder.HasIndex(t => t.TableNumber)
            .IsUnique();

        builder.HasIndex(t => t.Status);

        builder.HasIndex(t => t.Zone);
    }
}
