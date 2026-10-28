namespace GameScore.Api.Catalog;

/// <summary>
/// Fuente externa de datos de videojuegos (nombres, portadas, géneros).
/// Hoy la implementa IGDB (<see cref="Igdb.IgdbCatalog"/>).
/// </summary>
public interface IGameCatalog
{
    Task<List<CatalogGame>> SearchAsync(string query, int page, int pageSize, CancellationToken ct);

    /// <summary>Juegos populares recientes, para la portada.</summary>
    Task<List<CatalogGame>> GetPopularAsync(int count, CancellationToken ct);

    /// <summary>Un juego por su id en el catálogo, o null si no existe.</summary>
    Task<CatalogGame?> GetGameAsync(int id, CancellationToken ct);

    Task<List<CatalogGenre>> GetGenresAsync(CancellationToken ct);
}
