namespace GameScore.Api.Catalog;

/// <summary>
/// Fuente externa de datos de videojuegos (nombres, portadas, géneros).
/// Hoy la implementa IGDB (<see cref="Igdb.IgdbCatalog"/>).
/// </summary>
public interface IGameCatalog
{
    /// <summary>Busca por nombre. Devuelve todos los resultados, ordenados por relevancia y popularidad.</summary>
    Task<List<CatalogGame>> SearchAsync(string query, CatalogGenreFilter? genre, CancellationToken ct);

    /// <summary>Recorre el catálogo por páginas, en orden alfabético.</summary>
    Task<CatalogPage> BrowseAsync(int page, int pageSize, CatalogGenreFilter? genre, CancellationToken ct);

    /// <summary>Juegos populares recientes.</summary>
    Task<List<CatalogGame>> GetPopularAsync(int count, CancellationToken ct);

    /// <summary>Un juego por su id en el catálogo, o null si no existe.</summary>
    Task<CatalogGame?> GetGameAsync(int id, CancellationToken ct);

    Task<List<CatalogGenre>> GetGenresAsync(CancellationToken ct);
}
