using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.HasKey(g => g.Id);

        // Un género de IGDB y una temática de IGDB pueden compartir id: la unicidad es por (Kind, ExternalId)
        builder.HasIndex(g => new { g.Kind, g.ExternalId }).IsUnique();
        builder.HasIndex(g => g.Slug);

        builder.Property(g => g.Kind).HasConversion<int>();
        builder.Property(g => g.Name).HasMaxLength(100).IsRequired();
        builder.Property(g => g.Slug).HasMaxLength(100).IsRequired();
    }
}
