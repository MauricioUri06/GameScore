namespace GameScore.Api.Entities;

/// <summary>Juego que el usuario terminó (sale de "Jugando ahora" y pasa a "Juegos terminados").</summary>
public class FinishedGame
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public DateTime FinishedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Horas jugadas que tenía en "Jugando ahora" al terminarlo (se suman si lo vuelve a terminar).</summary>
    public double HoursPlayed { get; set; }
}
