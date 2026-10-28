using GameScore.Api.Catalog;
using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Services;

/// <summary>
/// Lógica de juegos: búsqueda en el catálogo externo (IGDB), copia local en la BD y armado de la ficha.
/// </summary>
public class GameService(GameScoreDbContext db, IGameCatalog catalog, IOptions<CatalogOptions> catalogOptions)
{
    private readonly CatalogOptions _catalogOptions = catalogOptions.Value;

    public async Task<List<GameSummaryDto>> SearchAsync(string query, int page, CancellationToken ct)
    {
        var games = await catalog.SearchAsync(query, page, 20, ct);
        return await ToSummariesAsync(games, ct);
    }

    public async Task<List<GameSummaryDto>> GetPopularAsync(CancellationToken ct)
    {
        var games = await catalog.GetPopularAsync(12, ct);
        return await ToSummariesAsync(games, ct);
    }

    public async Task<GameDetailDto?> GetDetailAsync(int externalId, string? currentUserId, CancellationToken ct)
    {
        var game = await EnsureCachedAsync(externalId, ct);
        if (game is null) return null;

        var scores = await db.Ratings
            .Where(r => r.GameId == game.Id)
            .Select(r => r.Score)
            .ToListAsync(ct);

        // Distribución en 10 "cubetas": 0.5, 1.0, ..., 5.0
        var distribution = new int[10];
        foreach (var s in scores)
        {
            var index = (int)(s * 2) - 1;
            if (index is >= 0 and < 10) distribution[index]++;
        }

        MyRatingDto? myRating = null;
        if (currentUserId is not null)
        {
            myRating = await db.Ratings
                .Where(r => r.GameId == game.Id && r.UserId == currentUserId)
                .Select(r => new MyRatingDto(r.Score, r.Review, r.UpdatedAt))
                .FirstOrDefaultAsync(ct);
        }

        var recentReviews = await db.Ratings
            .Where(r => r.GameId == game.Id)
            .OrderByDescending(r => r.UpdatedAt)
            .Take(10)
            .Select(r => new ReviewDto(
                r.User.UserName!, r.User.DisplayName, r.User.AvatarUrl, r.Score, r.Review, r.UpdatedAt))
            .ToListAsync(ct);

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
            recentReviews);
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

    /// <summary>Sincroniza la lista de géneros del catálogo si la tabla está vacía.</summary>
    public async Task<List<GenreDto>> GetGenresAsync(CancellationToken ct)
    {
        if (!await db.Genres.AnyAsync(ct))
        {
            var catalogGenres = await catalog.GetGenresAsync(ct);
            await UpsertGenresAsync(catalogGenres, ct);
            await db.SaveChangesAsync(ct);
        }

        return await db.Genres
            .OrderBy(g => g.Name)
            .Select(g => new GenreDto(g.Id, g.Name, g.Slug))
            .ToListAsync(ct);
    }

    private async Task<List<Genre>> UpsertGenresAsync(IEnumerable<CatalogGenre> catalogGenres, CancellationToken ct)
    {
        var list = catalogGenres.DistinctBy(g => g.Id).ToList();
        var ids = list.Select(g => g.Id).ToList();

        var existing = await db.Genres
            .Where(g => ids.Contains(g.ExternalId))
            .ToDictionaryAsync(g => g.ExternalId, ct);

        var result = new List<Genre>();
        foreach (var cg in list)
        {
            if (!existing.TryGetValue(cg.Id, out var genre))
            {
                genre = new Genre { ExternalId = cg.Id };
                db.Genres.Add(genre);
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
