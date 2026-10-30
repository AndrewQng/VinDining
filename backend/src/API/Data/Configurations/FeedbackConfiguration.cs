using API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace API.Data.Configurations;

public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("Feedbacks");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Rating)
            .IsRequired();

        builder.Property(f => f.Comment)
            .HasMaxLength(1000);

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        builder.HasOne(f => f.Reservation)
            .WithMany(r => r.Feedbacks)
            .HasForeignKey(f => f.ReservationId)
            .IsRequired(true)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.ReservationId);

        builder.HasIndex(f => f.Rating);
    }
}
