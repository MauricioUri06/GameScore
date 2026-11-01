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
        builder.Property(p => p.Family).HasMaxLength(30).IsRequired();

        // Lista fija de plataformas: se inserta con la migración.
        // Para agregar una nueva: súmala aquí con un Id nuevo y crea otra migración.
        builder.HasData(
            P(1, "pc", "PC (Windows)", "PC", 1),
            P(2, "mac", "Mac", "PC", 2),
            P(3, "linux", "Linux", "PC", 3),
            P(4, "steam-deck", "Steam Deck", "PC", 4),

            P(10, "ps5", "PlayStation 5", "PlayStation", 10),
            P(11, "ps4", "PlayStation 4", "PlayStation", 11),
            P(12, "ps3", "PlayStation 3", "PlayStation", 12),
            P(13, "ps2", "PlayStation 2", "PlayStation", 13),
            P(14, "ps1", "PlayStation", "PlayStation", 14),
            P(15, "psp", "PSP", "PlayStation", 15),
            P(16, "ps-vita", "PS Vita", "PlayStation", 16),
            P(17, "psvr2", "PlayStation VR2", "PlayStation", 17),

            P(20, "xbox-series", "Xbox Series X|S", "Xbox", 20),
            P(21, "xbox-one", "Xbox One", "Xbox", 21),
            P(22, "xbox-360", "Xbox 360", "Xbox", 22),
            P(23, "xbox", "Xbox (original)", "Xbox", 23),

            P(30, "switch-2", "Nintendo Switch 2", "Nintendo", 30),
            P(31, "switch", "Nintendo Switch", "Nintendo", 31),
            P(32, "wii-u", "Wii U", "Nintendo", 32),
            P(33, "wii", "Wii", "Nintendo", 33),
            P(34, "gamecube", "GameCube", "Nintendo", 34),
            P(35, "n64", "Nintendo 64", "Nintendo", 35),
            P(36, "snes", "Super Nintendo", "Nintendo", 36),
            P(37, "nes", "NES", "Nintendo", 37),
            P(38, "3ds", "Nintendo 3DS", "Nintendo", 38),
            P(39, "ds", "Nintendo DS", "Nintendo", 39),
            P(40, "gba", "Game Boy Advance", "Nintendo", 40),
            P(41, "gameboy", "Game Boy / Color", "Nintendo", 41),

            P(50, "android", "Android", "Otras", 50),
            P(51, "ios", "iPhone / iPad", "Otras", 51),
            P(52, "meta-quest", "Meta Quest", "Otras", 52),
            P(53, "dreamcast", "Sega Dreamcast", "Otras", 53),
            P(54, "saturn", "Sega Saturn", "Otras", 54),
            P(55, "genesis", "Sega Genesis / Mega Drive", "Otras", 55),
            P(56, "arcade", "Arcade / recreativas", "Otras", 56));
    }

    private static Platform P(int id, string slug, string name, string family, int order) =>
        new() { Id = id, Slug = slug, Name = name, Family = family, SortOrder = order };
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
