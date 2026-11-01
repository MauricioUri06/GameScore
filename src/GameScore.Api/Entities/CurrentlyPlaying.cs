namespace GameScore.Api.Entities;

/// <summary>Juego que el usuario está jugando ahora (se muestra en su perfil).</summary>
public class CurrentlyPlaying
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    /// <summary>Orden en que el usuario los muestra.</summary>
    public int Position { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
