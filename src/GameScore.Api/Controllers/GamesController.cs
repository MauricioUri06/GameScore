using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

[ApiController]
[Route("api/games")]
public class GamesController(GameService games, RankingService ranking, GameScoreDbContext db) : ControllerBase
{
    /// <summary>
    /// Todos los juegos, de 48 en 48 y en orden alfabético.
    /// Filtros opcionales: <c>genre</c> (slug de categoría) y <c>q</c> (nombre).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<GameSummaryDto>>> Browse(
        [FromQuery] int page = 1, [FromQuery] string? genre = null, [FromQuery] string? q = null,
        CancellationToken ct = default)
    {
        var query = q?.Trim();
        if (query is { Length: < 2 }) query = null;
        return await games.BrowseAsync(page, genre, query, ct);
    }

    /// <summary>
    /// Busca juegos por nombre. Con <c>limit</c> devuelve solo los primeros (autocompletado);
    /// sin él, todos los resultados.
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<GameSummaryDto>>> Search(
        [FromQuery] string? q, [FromQuery] int? limit = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(new List<GameSummaryDto>());

        return await games.SearchAsync(q.Trim(), null, ct, limit is null ? null : Math.Clamp(limit.Value, 1, 20));
    }

    /// <summary>Juegos populares recientes (desde IGDB).</summary>
    [HttpGet("popular")]
    public async Task<ActionResult<List<GameSummaryDto>>> Popular([FromQuery] int count = 12, CancellationToken ct = default) =>
        await games.GetPopularAsync(Math.Clamp(count, 1, 100), ct);

    /// <summary>Ranking completo por páginas (de 50 en 50).</summary>
    [HttpGet("ranking/pages")]
    public async Task<ActionResult<PagedResultDto<RankedGameDto>>> RankingPage(
        [FromQuery] int page = 1, [FromQuery] string? genre = null, CancellationToken ct = default) =>
        await ranking.GetPageAsync(Math.Clamp(page, 1, 10_000), genre, ct);

    /// <summary>Ranking de los mejores juegos calificados por la comunidad.</summary>
    [HttpGet("ranking")]
    public async Task<ActionResult<List<RankedGameDto>>> Ranking(
        [FromQuery] int limit = 50, [FromQuery] string? genre = null, CancellationToken ct = default) =>
        await ranking.GetTopAsync(Math.Clamp(limit, 1, 100), genre, ct);

    /// <summary>Ficha de un juego: datos, promedio, distribución, tu calificación y reseñas recientes.</summary>
    [HttpGet("{gameId:int}")]
    public async Task<ActionResult<GameDetailDto>> Get(int gameId, CancellationToken ct)
    {
        var detail = await games.GetDetailAsync(gameId, User.GetUserId(), ct);
        if (detail is null) return NotFound();
        return detail;
    }

    /// <summary>Crea o actualiza tu calificación de un juego.</summary>
    [Authorize]
    [HttpPut("{gameId:int}/rating")]
    public async Task<ActionResult<MyRatingDto>> Rate(int gameId, RateGameRequest request, CancellationToken ct)
    {
        if (request.Score * 2 != Math.Floor(request.Score * 2))
        {
            ModelState.AddModelError(nameof(request.Score), "El puntaje debe ir en pasos de 0.5.");
            return ValidationProblem(ModelState);
        }

        if (!await db.Platforms.AnyAsync(p => p.Id == request.PlatformId, ct))
        {
            ModelState.AddModelError(nameof(request.PlatformId), "Esa plataforma no existe.");
            return ValidationProblem(ModelState);
        }

        var game = await games.EnsureCachedAsync(gameId, ct);
        if (game is null) return NotFound();

        var userId = User.GetRequiredUserId();
        var rating = await db.Ratings.FirstOrDefaultAsync(r => r.UserId == userId && r.GameId == game.Id, ct);
        if (rating is null)
        {
            rating = new Rating { UserId = userId, GameId = game.Id };
            db.Ratings.Add(rating);
        }

        rating.Score = request.Score;
        rating.Review = string.IsNullOrWhiteSpace(request.Review) ? null : request.Review.Trim();
        rating.PlatformId = request.PlatformId;
        rating.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return new MyRatingDto(rating.Score, rating.Review, rating.PlatformId, rating.UpdatedAt);
    }

    /// <summary>Elimina tu calificación de un juego.</summary>
    [Authorize]
    [HttpDelete("{gameId:int}/rating")]
    public async Task<IActionResult> DeleteRating(int gameId, CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        var deleted = await db.Ratings
            .Where(r => r.UserId == userId && r.Game.ExternalId == gameId)
            .ExecuteDeleteAsync(ct);

        return deleted == 0 ? NotFound() : NoContent();
    }
}
