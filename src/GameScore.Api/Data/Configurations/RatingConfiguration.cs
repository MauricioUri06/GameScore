using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class RatingConfiguration : IEntityTypeConfiguration<Rating>
{
    public void Configure(EntityTypeBuilder<Rating> builder)
    {
        builder.HasKey(r => r.Id);

        // Un usuario solo puede calificar una vez cada juego
        builder.HasIndex(r => new { r.UserId, r.GameId }).IsUnique();

        builder.Property(r => r.Score).HasPrecision(2, 1).IsRequired();
        builder.Property(r => r.Review).HasMaxLength(2000);

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Ratings_Score",
            "\"Score\" >= 0.5 AND \"Score\" <= 5"));

        builder.HasOne(r => r.User)
            .WithMany(u => u.Ratings)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Game)
            .WithMany(g => g.Ratings)
            .HasForeignKey(r => r.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
