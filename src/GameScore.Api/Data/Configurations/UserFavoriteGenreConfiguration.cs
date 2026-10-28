using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class UserFavoriteGenreConfiguration : IEntityTypeConfiguration<UserFavoriteGenre>
{
    public void Configure(EntityTypeBuilder<UserFavoriteGenre> builder)
    {
        builder.HasKey(f => new { f.UserId, f.GenreId });

        builder.HasOne(f => f.User)
            .WithMany(u => u.FavoriteGenres)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Genre)
            .WithMany()
            .HasForeignKey(f => f.GenreId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
