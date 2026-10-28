using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Services;

/// <summary>
/// Ranking de mejores juegos usando promedio bayesiano (el mismo enfoque que el Top 250 de IMDb):
///
///   puntaje = (v / (v + m)) * R + (m / (v + m)) * C
///
///   R = promedio del juego, v = cantidad de calificaciones del juego,
///   C = promedio global de todas las calificaciones, m = RankingOptions.MinVotes.
///
/// Así un juego con pocas notas se "acerca" al promedio global hasta que acumula votos.
/// </summary>
public class RankingService(GameScoreDbContext db, IOptions<RankingOptions> options)
{
    private readonly int _m = Math.Max(0, options.Value.MinVotes);

    public async Task<List<RankedGameDto>> GetTopAsync(int limit, string? genreSlug, CancellationToken ct)
    {
        var ratings = db.Ratings.AsQueryable();
        if (!string.IsNullOrWhiteSpace(genreSlug))
            ratings = ratings.Where(r => r.Game.Genres.Any(g => g.Slug == genreSlug));

        var perGame = await ratings
            .GroupBy(r => r.GameId)
            .Select(g => new
            {
                GameId = g.Key,
                Avg = g.Average(r => (double)r.Score),
                Count = g.Count(),
                Sum = g.Sum(r => (double)r.Score)
            })
            .ToListAsync(ct);

        if (perGame.Count == 0) return [];

        var totalCount = perGame.Sum(p => p.Count);
        var globalMean = perGame.Sum(p => p.Sum) / totalCount;

        var top = perGame
            .Select(p => new
            {
                p.GameId,
                p.Avg,
                p.Count,
                Weighted = (p.Count / (double)(p.Count + _m)) * p.Avg + (_m / (double)(p.Count + _m)) * globalMean
            })
            .OrderByDescending(p => p.Weighted)
            .ThenByDescending(p => p.Count)
            .Take(limit)
            .ToList();

        var ids = top.Select(t => t.GameId).ToList();
        var games = await db.Games
            .Where(g => ids.Contains(g.Id))
            .ToDictionaryAsync(g => g.Id, ct);

        return top.Select((t, i) =>
        {
            var game = games[t.GameId];
            return new RankedGameDto(
                i + 1,
                game.RawgId,
                game.Slug,
                game.Name,
                game.BackgroundImage,
                game.Released,
                Math.Round(t.Avg, 2),
                Math.Round(t.Weighted, 3),
                t.Count);
        }).ToList();
    }
}
