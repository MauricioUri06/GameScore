using GameScore.Api.Entities;

namespace GameScore.Api.Catalog;

// Modelos neutrales del catálogo de juegos. El resto de la app solo conoce estos tipos,
// así que cambiar de proveedor (IGDB, RAWG, etc.) solo afecta a la carpeta Catalog/.

public record CatalogGenre(int Id, string Name, string Slug, GenreKind Kind = GenreKind.Genre);

/// <summary>Filtro por género o temática (id en el catálogo externo).</summary>
public record CatalogGenreFilter(GenreKind Kind, int Id);

public record CatalogGame(
    int Id,
    string Slug,
    string Name,
    string? CoverUrl,
    string? BackgroundUrl,
    DateOnly? Released,
    string? Summary,
    IReadOnlyList<CatalogGenre> Genres);

/// <summary>Una página de resultados y el total de juegos que cumplen el filtro.</summary>
public record CatalogPage(List<CatalogGame> Items, int TotalCount);

/// <summary>Error al hablar con el proveedor del catálogo (credenciales, caída, límite de uso…).</summary>
public class CatalogException(string message, int? statusCode = null, string? details = null) : Exception(message)
{
    public int? StatusCode { get; } = statusCode;

    /// <summary>Respuesta cruda del proveedor (para registros y diagnóstico, no para el usuario).</summary>
    public string? Details { get; } = details;
}
