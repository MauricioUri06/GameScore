namespace GameScore.Api.Entities;

/// <summary>En IGDB hay "géneros" (RPG, Shooter…) y "temáticas" (Terror, Fantasía…). Mostramos ambos como géneros.</summary>
public enum GenreKind
{
    Genre = 0,
    Theme = 1
}

public class Genre
{
    public int Id { get; set; }

    /// <summary>Id en el catálogo externo (IGDB). Único junto con <see cref="Kind"/>.</summary>
    public int ExternalId { get; set; }

    public GenreKind Kind { get; set; } = GenreKind.Genre;

    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public ICollection<Game> Games { get; set; } = new List<Game>();
}
