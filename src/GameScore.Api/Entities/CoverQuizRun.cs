namespace GameScore.Api.Entities;

/// <summary>
/// Partida de "Adivina la portada": 10 rondas; en cada una la portada sale borrosa y se aclara con
/// cada intento fallido. La lleva el servidor: el navegador nunca recibe la portada nítida ni el nombre
/// hasta que la ronda termina.
/// </summary>
public class CoverQuizRun
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>null = partida de alguien sin sesión (no guarda récord).</summary>
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    public int Round { get; set; } = 1;
    public int Score { get; set; }

    /// <summary>Intentos fallidos en la ronda actual.</summary>
    public int Attempts { get; set; }

    public bool RoundOver { get; set; }
    public bool Finished { get; set; }

    public int GameId { get; set; }
    public string GameName { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;

    public int[] UsedGameIds { get; set; } = [];

    public DateTime RoundStartedAt { get; set; } = DateTime.UtcNow;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
