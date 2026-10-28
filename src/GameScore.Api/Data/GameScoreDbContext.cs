using GameScore.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Data;

public class GameScoreDbContext(DbContextOptions<GameScoreDbContext> options)
    : IdentityDbContext<AppUser>(options)
{
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<TopGame> TopGames => Set<TopGame>();
    public DbSet<UserFavoriteGenre> UserFavoriteGenres => Set<UserFavoriteGenre>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Carga todas las clases IEntityTypeConfiguration<T> de la carpeta Data/Configurations
        builder.ApplyConfigurationsFromAssembly(typeof(GameScoreDbContext).Assembly);
    }
}
