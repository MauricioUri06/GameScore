namespace GameScore.Api.Entities;

public class UserFavoriteGenre
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int GenreId { get; set; }
    public Genre Genre { get; set; } = null!;
}
