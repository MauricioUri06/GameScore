namespace GameScore.Api.Entities;

/// <summary>
/// Partida de Older/Newer. La lleva el servidor: el navegador nunca recibe el año del juego
/// que hay que adivinar, así nadie puede hacer trampa para inflar su récord.
/// </summary>
public class OlderNewerRun
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>null = partida de alguien sin sesión (no guarda récord).</summary>
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    public int Score { get; set; }
    public bool Finished { get; set; }

    // Juego de referencia (año visible)
    public int LeftGameId { get; set; }
    public string LeftName { get; set; } = string.Empty;
    public string? LeftCover { get; set; }
    public int LeftYear { get; set; }

    // Juego a adivinar (año oculto hasta responder)
    public int RightGameId { get; set; }
    public string RightName { get; set; } = string.Empty;
    public string? RightCover { get; set; }
    public int RightYear { get; set; }

    /// <summary>Juegos que ya salieron en esta partida (ids de IGDB), para no repetirlos.</summary>
    public int[] UsedGameIds { get; set; } = [];

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
