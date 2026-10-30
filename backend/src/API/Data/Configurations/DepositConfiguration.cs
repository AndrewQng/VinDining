using API.Models.Entities;
using API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API.Data.Configurations;

public class DepositConfiguration : IEntityTypeConfiguration<Deposit>
{
    public void Configure(EntityTypeBuilder<Deposit> builder)
    {
        builder.ToTable("Deposits");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(d => d.RefundAmount)
            .HasPrecision(18, 2);

        builder.Property(d => d.TransactionId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(d => d.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(DepositStatus.Pending)
            .IsRequired();

        builder.Property(d => d.CreatedAt)
            .IsRequired();

        builder.HasOne(d => d.Reservation)
            .WithOne(r => r.Deposit)
            .HasForeignKey<Deposit>(d => d.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.ReservationId)
            .IsUnique();

        builder.HasIndex(d => d.TransactionId);

        builder.HasIndex(d => d.Status);
    }
}
