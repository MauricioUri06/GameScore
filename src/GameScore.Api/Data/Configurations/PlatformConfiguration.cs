using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class PlatformConfiguration : IEntityTypeConfiguration<Platform>
{
    public void Configure(EntityTypeBuilder<Platform> builder)
    {
        builder.HasKey(p => p.Id);
        builder.HasIndex(p => p.Slug).IsUnique();
        builder.Property(p => p.Slug).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Name).HasMaxLength(80).IsRequired();

        // Lista fija de plataformas: se inserta con la migración.
        // Los ids 1 (PC) y 30 (Nintendo) vienen de la lista anterior por consolas,
        // así se conservan las selecciones que ya existían.
        builder.HasData(
            P(1, "pc", "PC", 1),
            P(10, "playstation", "PlayStation", 2),
            P(20, "xbox-consolas", "Xbox", 3),
            P(30, "nintendo", "Nintendo", 4),
            P(50, "movil", "Móvil", 5),
            P(52, "realidad-virtual", "Realidad virtual", 6),
            P(56, "retro-otras", "Retro / otras", 7));
    }

    private static Platform P(int id, string slug, string name, int order) =>
        new() { Id = id, Slug = slug, Name = name, SortOrder = order };
}

public class UserPlatformConfiguration : IEntityTypeConfiguration<UserPlatform>
{
    public void Configure(EntityTypeBuilder<UserPlatform> builder)
    {
        builder.HasKey(up => new { up.UserId, up.PlatformId });

        builder.HasOne(up => up.User)
            .WithMany(u => u.Platforms)
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(up => up.Platform)
            .WithMany()
            .HasForeignKey(up => up.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
