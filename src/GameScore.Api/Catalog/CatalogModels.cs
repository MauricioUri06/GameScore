namespace GameScore.Api.Catalog;

// Modelos neutrales del catálogo de juegos. El resto de la app solo conoce estos tipos,
// así que cambiar de proveedor (IGDB, RAWG, etc.) solo afecta a la carpeta Catalog/.

public record CatalogGenre(int Id, string Name, string Slug);

public record CatalogGame(
    int Id,
    string Slug,
    string Name,
    string? CoverUrl,
    string? BackgroundUrl,
    DateOnly? Released,
    string? Summary,
    IReadOnlyList<CatalogGenre> Genres);

/// <summary>Error al hablar con el proveedor del catálogo (credenciales, caída, límite de uso…).</summary>
public class CatalogException(string message, int? statusCode = null) : Exception(message)
{
    public int? StatusCode { get; } = statusCode;
}
