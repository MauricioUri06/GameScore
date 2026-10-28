using Microsoft.AspNetCore.Identity;

namespace GameScore.Api.Entities;

/// <summary>
/// Usuario de GameScore. Extiende IdentityUser (UserName, Email, PasswordHash, etc.).
/// </summary>
public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<TopGame> TopGames { get; set; } = new List<TopGame>();
    public ICollection<UserFavoriteGenre> FavoriteGenres { get; set; } = new List<UserFavoriteGenre>();
}
