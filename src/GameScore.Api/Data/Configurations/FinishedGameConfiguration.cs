using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class FinishedGameConfiguration : IEntityTypeConfiguration<FinishedGame>
{
    public void Configure(EntityTypeBuilder<FinishedGame> builder)
    {
        builder.HasKey(f => new { f.UserId, f.GameId });
        builder.ToTable("FinishedGames", t => t.HasCheckConstraint("CK_FinishedGames_Hours", "\"HoursPlayed\" >= 0"));
        builder.HasIndex(f => new { f.UserId, f.FinishedAt });

        builder.HasOne(f => f.User)
            .WithMany(u => u.FinishedGames)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Game)
            .WithMany()
            .HasForeignKey(f => f.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
