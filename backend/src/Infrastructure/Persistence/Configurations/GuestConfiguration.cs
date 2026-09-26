using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class GuestConfiguration : IEntityTypeConfiguration<Guest>
{
    public void Configure(EntityTypeBuilder<Guest> builder)
    {
        builder.ToTable("Guests");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(g => g.PhoneNumber)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(g => g.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(g => g.CreatedAt)
            .IsRequired();

        builder.HasIndex(g => g.PhoneNumber);
    }
}
