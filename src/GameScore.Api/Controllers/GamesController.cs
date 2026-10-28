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
    /// <summary>Busca juegos en el catálogo (IGDB). Incluye el promedio local si ya fueron calificados en GameScore.</summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<GameSummaryDto>>> Search(
        [FromQuery] string? q, [FromQuery] int page = 1, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(new List<GameSummaryDto>());

        return await games.SearchAsync(q.Trim(), Math.Max(1, page), ct);
    }

    /// <summary>Juegos populares recientes (desde IGDB), para la portada.</summary>
    [HttpGet("popular")]
    public async Task<ActionResult<List<GameSummaryDto>>> Popular(CancellationToken ct) =>
        await games.GetPopularAsync(ct);

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
        rating.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return new MyRatingDto(rating.Score, rating.Review, rating.UpdatedAt);
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
