namespace GameScore.Api.Entities;

/// <summary>
/// Uno de los 5 juegos favoritos que el usuario muestra en su perfil.
/// </summary>
public class TopGame
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    /// <summary>Posición 1 a 5.</summary>
    public int Position { get; set; }

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
}
