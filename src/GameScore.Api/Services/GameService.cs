using GameScore.Api.Catalog;
using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Services;

/// <summary>
/// Lógica de juegos: búsqueda en el catálogo externo (IGDB), copia local en la BD y armado de la ficha.
/// </summary>
public class GameService(GameScoreDbContext db, IGameCatalog catalog, IOptions<CatalogOptions> catalogOptions)
{
    // Última vez que se sincronizó la lista completa de géneros con el catálogo (compartida entre peticiones)
    private static DateTime _genresSyncedAt = DateTime.MinValue;
    private static readonly SemaphoreSlim GenresLock = new(1, 1);

    private readonly CatalogOptions _catalogOptions = catalogOptions.Value;

    /// <summary>Juegos por página en la sección "Juegos" (48 llena filas de 2, 3, 4, 6 y 8 columnas).</summary>
    public const int PageSize = 48;

    /// <summary>
    /// Páginas máximas al recorrer el catálogo (1000 × 48 = 48.000 juegos).
    /// Es un tope de seguridad; los juegos con pocas calificaciones en IGDB se encuentran con el buscador.
    /// </summary>
    public const int MaxPages = 1000;

    /// <summary>
    /// Busca por nombre. Sin <paramref name="limit"/> devuelve todo lo que encuentra el catálogo;
    /// con límite (sugerencias del autocompletado) pide menos resultados para responder rápido.
    /// </summary>
    public async Task<List<GameSummaryDto>> SearchAsync(string query, string? genreSlug, CancellationToken ct, int? limit = null)
    {
        var genre = await ResolveGenreAsync(genreSlug, ct);
        var games = limit is { } count
            ? (await catalog.SearchAsync(query, genre, ct, max: 50)).Take(count).ToList()
            : await catalog.SearchAsync(query, genre, ct);
        return await ToSummariesAsync(games, ct);
    }

    /// <summary>
    /// Lista de juegos por páginas de 48, opcionalmente filtrada por categoría y/o por nombre.
    /// </summary>
    public async Task<PagedResultDto<GameSummaryDto>> BrowseAsync(
        int page, string? genreSlug, string? query, CancellationToken ct)
    {
        page = Math.Clamp(page, 1, MaxPages);
        var genre = await ResolveGenreAsync(genreSlug, ct);

        if (!string.IsNullOrWhiteSpace(query))
        {
            // Con búsqueda, el catálogo devuelve todos los resultados juntos: los ordenamos
            // alfabéticamente (como el resto de la pestaña Juegos) y los paginamos aquí
            var all = (await catalog.SearchAsync(query.Trim(), genre, ct))
                .OrderBy(g => g.Name, StringComparer.Create(System.Globalization.CultureInfo.InvariantCulture, ignoreCase: true))
                .ToList();
            var pageItems = all.Skip((page - 1) * PageSize).Take(PageSize).ToList();
            return Paged(await ToSummariesAsync(pageItems, ct), page, all.Count);
        }

        var result = await catalog.BrowseAsync(page, PageSize, genre, ct);
        var total = Math.Min(result.TotalCount, MaxPages * PageSize);
        return Paged(await ToSummariesAsync(result.Items, ct), page, total);
    }

    public async Task<List<GameSummaryDto>> GetPopularAsync(int count, CancellationToken ct)
    {
        var games = await catalog.GetPopularAsync(count, ct);
        return await ToSummariesAsync(games, ct);
    }

    private static PagedResultDto<GameSummaryDto> Paged(List<GameSummaryDto> items, int page, int total) =>
        new(items, page, PageSize, total, Math.Max(1, (int)Math.Ceiling(total / (double)PageSize)));

    /// <summary>Convierte el slug de una categoría (ej. "horror") en el filtro del catálogo.</summary>
    private async Task<CatalogGenreFilter?> ResolveGenreAsync(string? slug, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;

        var genre = await db.Genres.AsNoTracking().FirstOrDefaultAsync(g => g.Slug == slug, ct);
        if (genre is null)
        {
            // Puede que la lista de géneros aún no se haya sincronizado
            await GetGenresAsync(ct);
            genre = await db.Genres.AsNoTracking().FirstOrDefaultAsync(g => g.Slug == slug, ct);
        }

        return genre is null ? null : new CatalogGenreFilter(genre.Kind, genre.ExternalId);
    }

    public async Task<GameDetailDto?> GetDetailAsync(int externalId, string? currentUserId, CancellationToken ct)
    {
        var game = await EnsureCachedAsync(externalId, ct);
        if (game is null) return null;

        var scores = await db.Ratings
            .Where(r => r.GameId == game.Id)
            .Select(r => r.Score)
            .ToListAsync(ct);

        // Distribución en 11 "cubetas": 0, 0.5, 1.0, ..., 5.0
        var distribution = new int[11];
        foreach (var s in scores)
        {
            var index = (int)(s * 2);
            if (index is >= 0 and <= 10) distribution[index]++;
        }

        MyRatingDto? myRating = null;
        if (currentUserId is not null)
        {
            myRating = await db.Ratings
                .Where(r => r.GameId == game.Id && r.UserId == currentUserId)
                .Select(r => new MyRatingDto(r.Score, r.Review, r.PlatformId, r.UpdatedAt))
                .FirstOrDefaultAsync(ct);
        }

        var recentReviews = await db.Ratings
            .Where(r => r.GameId == game.Id)
            .OrderByDescending(r => r.UpdatedAt)
            .Take(20)
            .Select(r => new ReviewDto(
                r.Id,
                r.User.UserName!, AvatarUrls.For(r.User.UserName!, r.User.AvatarUpdatedAt), r.Score, r.Review,
                r.Platform != null ? r.Platform.Name : null, r.UpdatedAt,
                r.Votes.Count(v => v.Value == 1),
                r.Votes.Count(v => v.Value == -1),
                currentUserId == null
                    ? (short)0
                    : r.Votes.Where(v => v.UserId == currentUserId).Select(v => v.Value).FirstOrDefault()))
            .ToListAsync(ct);

        var reviewsCount = await db.Ratings.CountAsync(r => r.GameId == game.Id && r.Review != null, ct);

        // Consolas donde salió el juego, según IGDB (si no hay datos, el frontend muestra todas)
        var gamePlatformIds = game.PlatformIgdbIds ?? [];
        var available = (await db.Platforms.AsNoTracking().OrderBy(p => p.SortOrder).ToListAsync(ct))
            .Where(p => p.IgdbIds.Any(id => gamePlatformIds.Contains(id)))
            .Select(p => new PlatformDto(p.Id, p.Name, p.Family))
            .ToList();

        return new GameDetailDto(
            game.ExternalId,
            game.Slug,
            game.Name,
            game.CoverImage,
            game.BackgroundImage,
            game.Released,
            game.Description,
            game.Genres.OrderBy(g => g.Name).Select(g => new GenreDto(g.Id, g.Name, g.Slug)).ToList(),
            scores.Count > 0 ? Math.Round(scores.Average(s => (double)s), 2) : null,
            scores.Count,
            distribution,
            myRating,
            recentReviews,
            available,
            reviewsCount);
    }

    /// <summary>
    /// Devuelve el juego desde la BD; si no existe o está desactualizado, lo trae del catálogo y lo guarda.
    /// Devuelve null si el catálogo no conoce ese id.
    /// </summary>
    public async Task<Game?> EnsureCachedAsync(int externalId, CancellationToken ct)
    {
        var game = await db.Games
            .Include(g => g.Genres)
            .FirstOrDefaultAsync(g => g.ExternalId == externalId, ct);

        var isFresh = game is not null
                      && game.Description is not null
                      && game.PlatformIgdbIds is not null
                      && game.CachedAt > DateTime.UtcNow.AddDays(-_catalogOptions.CacheDays);
        if (isFresh) return game;

        CatalogGame? detail;
        try
        {
            detail = await catalog.GetGameAsync(externalId, ct);
        }
        catch (CatalogException) when (game is not null)
        {
            // Si el catálogo falla pero ya tenemos una copia, usamos la copia vieja
            return game;
        }

        if (detail is null) return game;

        if (game is null)
        {
            game = new Game { ExternalId = detail.Id };
            db.Games.Add(game);
        }

        game.Slug = detail.Slug;
        game.Name = detail.Name;
        game.CoverImage = detail.CoverUrl;
        game.BackgroundImage = detail.BackgroundUrl;
        game.Released = detail.Released;
        game.Description = detail.Summary ?? string.Empty;
        game.PlatformIgdbIds = detail.PlatformIds.ToArray();
        game.CachedAt = DateTime.UtcNow;

        game.Genres.Clear();
        foreach (var genre in await UpsertGenresAsync(detail.Genres, ct))
            game.Genres.Add(genre);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Otra petición guardó el mismo juego al mismo tiempo: descartamos y leemos el que quedó
            db.ChangeTracker.Clear();
            return await db.Games.Include(g => g.Genres).FirstOrDefaultAsync(g => g.ExternalId == externalId, ct);
        }

        return game;
    }

    /// <summary>
    /// Lista completa de géneros y temáticas. Se sincroniza con el catálogo al arrancar la API
    /// y luego una vez al día (no basta con mirar si la tabla está vacía: al calificar juegos
    /// se guardan solo los géneros de esos juegos).
    /// </summary>
    public async Task<List<GenreDto>> GetGenresAsync(CancellationToken ct)
    {
        if (_genresSyncedAt < DateTime.UtcNow.AddDays(-1))
        {
            await GenresLock.WaitAsync(ct);
            try
            {
                if (_genresSyncedAt < DateTime.UtcNow.AddDays(-1))
                {
                    var catalogGenres = await catalog.GetGenresAsync(ct);
                    await UpsertGenresAsync(catalogGenres, ct);
                    await db.SaveChangesAsync(ct);
                    _genresSyncedAt = DateTime.UtcNow;
                }
            }
            catch (CatalogException)
            {
                // Si el catálogo falla, mostramos los géneros que ya tenemos guardados (si hay)
                db.ChangeTracker.Clear();
                if (!await db.Genres.AnyAsync(ct)) throw;
            }
            finally
            {
                GenresLock.Release();
            }
        }

        return await db.Genres
            .OrderBy(g => g.Name)
            .Select(g => new GenreDto(g.Id, g.Name, g.Slug))
            .ToListAsync(ct);
    }

    private async Task<List<Genre>> UpsertGenresAsync(IEnumerable<CatalogGenre> catalogGenres, CancellationToken ct)
    {
        var list = catalogGenres.DistinctBy(g => (g.Kind, g.Id)).ToList();
        var ids = list.Select(g => g.Id).Distinct().ToList();

        var existing = (await db.Genres
                .Where(g => ids.Contains(g.ExternalId))
                .ToListAsync(ct))
            .ToDictionary(g => (g.Kind, g.ExternalId));

        var result = new List<Genre>();
        foreach (var cg in list)
        {
            if (!existing.TryGetValue((cg.Kind, cg.Id), out var genre))
            {
                genre = new Genre { ExternalId = cg.Id, Kind = cg.Kind };
                db.Genres.Add(genre);
                existing[(cg.Kind, cg.Id)] = genre;
            }

            genre.Name = cg.Name;
            genre.Slug = cg.Slug;
            result.Add(genre);
        }

        return result;
    }

    private async Task<List<GameSummaryDto>> ToSummariesAsync(List<CatalogGame> items, CancellationToken ct)
    {
        var externalIds = items.Select(i => i.Id).ToList();

        // Estadísticas locales (promedio y cantidad) de los juegos que ya fueron calificados aquí
        var stats = await db.Ratings
            .Where(r => externalIds.Contains(r.Game.ExternalId))
            .GroupBy(r => r.Game.ExternalId)
            .Select(g => new { ExternalId = g.Key, Avg = g.Average(r => (double)r.Score), Count = g.Count() })
            .ToDictionaryAsync(x => x.ExternalId, ct);

        return items.Select(i =>
        {
            stats.TryGetValue(i.Id, out var s);
            return new GameSummaryDto(
                i.Id,
                i.Slug,
                i.Name,
                i.CoverUrl,
                i.Released,
                i.Genres.Select(g => g.Name).ToList(),
                s is null ? null : Math.Round(s.Avg, 2),
                s?.Count ?? 0);
        }).ToList();
    }
}
