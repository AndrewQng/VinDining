using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("Invoices");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Subtotal)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(i => i.ServiceCharge)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(i => i.VatAmount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(i => i.DeductedDeposit)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(i => i.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(PaymentMethod.Cash)
            .IsRequired();

        builder.Property(i => i.IsPaid)
            .HasDefaultValue(false);

        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.HasOne(i => i.Order)
            .WithOne(o => o.Invoice)
            .HasForeignKey<Invoice>(i => i.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.SettleBy)
            .WithMany(s => s.InvoicesSettled)
            .HasForeignKey(i => i.SettleById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.OrderId)
            .IsUnique();

        builder.HasIndex(i => i.SettleById);

        builder.HasIndex(i => i.IsPaid);
    }
}
