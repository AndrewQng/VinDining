using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("Reservations");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.BookingCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.ReservationTime)
            .IsRequired();

        builder.Property(r => r.PartySize)
            .IsRequired();

        builder.Property(r => r.DurationMinutes)
            .HasDefaultValue(120)
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(ReservationStatus.Pending)
            .IsRequired();

        builder.Property(r => r.Note)
            .HasMaxLength(1000);

        builder.Property(r => r.CancelledReason)
            .HasMaxLength(500);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.HasOne(r => r.Guest)
            .WithMany(g => g.Reservations)
            .HasForeignKey(r => r.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Table)
            .WithMany(t => t.Reservations)
            .HasForeignKey(r => r.TableId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.BookingCode)
            .IsUnique();

        builder.HasIndex(r => new { r.TableId, r.ReservationTime });

        builder.HasIndex(r => r.ReservationTime);

        builder.HasIndex(r => r.Status);
    }
}
