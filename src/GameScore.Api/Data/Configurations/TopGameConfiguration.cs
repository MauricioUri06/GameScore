using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class TopGameConfiguration : IEntityTypeConfiguration<TopGame>
{
    public void Configure(EntityTypeBuilder<TopGame> builder)
    {
        // Cada usuario tiene a lo sumo un juego por posición...
        builder.HasKey(t => new { t.UserId, t.Position });

        // ...y no puede repetir un juego en su top
        builder.HasIndex(t => new { t.UserId, t.GameId }).IsUnique();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_TopGames_Position",
            "\"Position\" BETWEEN 1 AND 5"));

        builder.HasOne(t => t.User)
            .WithMany(u => u.TopGames)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Game)
            .WithMany()
            .HasForeignKey(t => t.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
