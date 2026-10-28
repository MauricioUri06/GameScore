using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        builder.HasKey(g => g.Id);

        builder.HasIndex(g => g.ExternalId).IsUnique();
        builder.HasIndex(g => g.Slug);

        builder.Property(g => g.Name).HasMaxLength(250).IsRequired();
        builder.Property(g => g.Slug).HasMaxLength(250).IsRequired();
        builder.Property(g => g.CoverImage).HasMaxLength(500);
        builder.Property(g => g.BackgroundImage).HasMaxLength(500);

        // Relación muchos a muchos Game <-> Genre con tabla intermedia "GameGenres"
        builder.HasMany(g => g.Genres)
            .WithMany(g => g.Games)
            .UsingEntity(j => j.ToTable("GameGenres"));
    }
}
