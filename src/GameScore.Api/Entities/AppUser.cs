using Microsoft.AspNetCore.Identity;

namespace GameScore.Api.Entities;

/// <summary>
/// Usuario de GameScore. Extiende IdentityUser: UserName es el nickname (lo único que ve la comunidad)
/// y PasswordHash guarda la clave de 6 dígitos.
/// </summary>
public class AppUser : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Cuándo subió su foto de perfil por última vez (null = sin foto). La imagen está en UserAvatar.</summary>
    public DateTime? AvatarUpdatedAt { get; set; }

    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<TopGame> TopGames { get; set; } = new List<TopGame>();
    public ICollection<UserFavoriteGenre> FavoriteGenres { get; set; } = new List<UserFavoriteGenre>();
    public ICollection<UserPlatform> Platforms { get; set; } = new List<UserPlatform>();
}
