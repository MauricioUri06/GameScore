namespace GameScore.Api.Entities;

/// <summary>
/// Partida de "Categorías" (1 jugador): en cada ronda sale una categoría y hay que nombrar un juego de ella.
/// Cuanto más rápido, más puntos. Se gana al llegar a 1000; con 3 errores (o tiempos agotados) se pierde.
/// El récord es el menor tiempo total para llegar a 1000.
/// </summary>
public class CategoryRun
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    public int Round { get; set; } = 1;
    public int Score { get; set; }
    public int Lives { get; set; } = 3;

    public bool RoundOver { get; set; }
    public bool Finished { get; set; }
    public bool Won { get; set; }

    /// <summary>Categoría actual (Genre.Id: género o temática).</summary>
    public int GenreId { get; set; }
    public string GenreName { get; set; } = string.Empty;

    /// <summary>Juegos ya usados (ids de IGDB): no se pueden repetir.</summary>
    public int[] UsedGameIds { get; set; } = [];
    public int[] UsedGenreIds { get; set; } = [];

    /// <summary>Suma del tiempo de respuesta de todas las rondas, en segundos.</summary>
    public double TotalSeconds { get; set; }

    public DateTime RoundStartedAt { get; set; } = DateTime.UtcNow;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
