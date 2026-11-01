namespace GameScore.Api.Entities;

/// <summary>
/// Calificación de un usuario a un juego. Escala de 0 a 5 en pasos de 0.5.
/// Un usuario solo puede tener una calificación por juego.
/// </summary>
public class Rating
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public decimal Score { get; set; }
    public string? Review { get; set; }

    /// <summary>Plataforma en la que lo jugó (PC, PlayStation…). Null en calificaciones antiguas.</summary>
    public int? PlatformId { get; set; }
    public Platform? Platform { get; set; }

    public ICollection<ReviewVote> Votes { get; set; } = new List<ReviewVote>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
