using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.HasKey(g => g.Id);
        builder.HasIndex(g => g.RawgId).IsUnique();
        builder.Property(g => g.Name).HasMaxLength(100).IsRequired();
        builder.Property(g => g.Slug).HasMaxLength(100).IsRequired();
    }
}
