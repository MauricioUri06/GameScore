namespace GameScore.Api.Entities;

/// <summary>Entrada del diario de un juego: lo último que el usuario hizo en él.</summary>
public class PlayingJournalEntry
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
