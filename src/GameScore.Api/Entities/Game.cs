namespace GameScore.Api.Entities;

/// <summary>
/// Copia local de un juego de RAWG. Solo guardamos lo necesario para mostrar
/// listas, rankings y perfiles sin depender de la API externa en cada consulta.
/// </summary>
public class Game
{
    public int Id { get; set; }
    public int RawgId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? BackgroundImage { get; set; }
    public DateOnly? Released { get; set; }
    public string? Description { get; set; }
    public DateTime CachedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Genre> Genres { get; set; } = new List<Genre>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
}
