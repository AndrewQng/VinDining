using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.ToTable("Staffs");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(s => s.PhoneNumber)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.Username)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(s => s.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.Role)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(StaffRole.Waitstaff)
            .IsRequired();

        builder.Property(s => s.IsActive)
            .HasDefaultValue(true);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.HasIndex(s => s.Username)
            .IsUnique();

        builder.HasIndex(s => s.Email)
            .IsUnique();
    }
}
