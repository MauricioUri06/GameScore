using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

/// <summary>
/// Minijuego Older/Newer: ¿el juego de la derecha salió antes o después que el de la izquierda?
/// Cada acierto suma un punto; al primer error se acaba la partida. Con sesión iniciada se guarda el récord.
/// </summary>
[ApiController]
[Route("api/older-newer")]
public class OlderNewerController(GameScoreDbContext db, OlderNewerPool pool) : ControllerBase
{
    /// <summary>Empieza una partida nueva.</summary>
    [HttpPost("start")]
    public async Task<ActionResult<OlderNewerStateDto>> Start(CancellationToken ct)
    {
        var userId = User.GetUserId();

        // Limpieza: partidas sin sesión de hace más de un día
        var yesterday = DateTime.UtcNow.AddDays(-1);
        await db.OlderNewerRuns.Where(r => r.UserId == null && r.UpdatedAt < yesterday).ExecuteDeleteAsync(ct);

        var left = await pool.PickAsync([], null, ct);
        if (left is null) return Problem("No hay juegos disponibles para jugar.", statusCode: 503);
        var right = await pool.PickAsync([left.Id], left.Year, ct);
        if (right is null) return Problem("No hay juegos disponibles para jugar.", statusCode: 503);

        var run = new OlderNewerRun
        {
            UserId = userId,
            LeftGameId = left.Id, LeftName = left.Name, LeftCover = left.CoverUrl, LeftYear = left.Year,
            RightGameId = right.Id, RightName = right.Name, RightCover = right.CoverUrl, RightYear = right.Year,
            UsedGameIds = [left.Id, right.Id]
        };
        db.OlderNewerRuns.Add(run);
        await db.SaveChangesAsync(ct);

        return new OlderNewerStateDto(run.Id, 0,
            new OlderNewerGameDto(left.Id, left.Name, left.CoverUrl, left.Year),
            new OlderNewerGameDto(right.Id, right.Name, right.CoverUrl, null),
            userId is null ? null : await BestAsync(userId, ct));
    }

    /// <summary>Responde si el juego de la derecha es más antiguo ("older") o más nuevo ("newer").</summary>
    [HttpPost("{runId:guid}/guess")]
    public async Task<ActionResult<OlderNewerGuessResultDto>> Guess(Guid runId, OlderNewerGuessRequest request, CancellationToken ct)
    {
        var guess = request.Guess?.Trim().ToLowerInvariant();
        if (guess is not ("older" or "newer"))
        {
            ModelState.AddModelError(nameof(request.Guess), "La respuesta debe ser \"older\" o \"newer\".");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetUserId();
        var run = await db.OlderNewerRuns.FirstOrDefaultAsync(r => r.Id == runId, ct);
        if (run is null || run.UserId != userId) return NotFound();
        if (run.Finished) return Conflict(new { message = "Esta partida ya terminó." });

        // Mejor puntaje en OTRAS partidas (para saber si esta es un récord nuevo)
        var previousBest = userId is null
            ? (int?)null
            : await db.OlderNewerRuns.Where(r => r.UserId == userId && r.Id != run.Id).MaxAsync(r => (int?)r.Score, ct) ?? 0;
        var rightYear = run.RightYear;
        var correct = run.RightYear == run.LeftYear
                      || (guess == "older" && run.RightYear < run.LeftYear)
                      || (guess == "newer" && run.RightYear > run.LeftYear);

        OlderNewerGameDto? nextRight = null;
        if (correct)
        {
            run.Score++;
            // El de la derecha pasa a ser la referencia y llega uno nuevo
            run.LeftGameId = run.RightGameId;
            run.LeftName = run.RightName;
            run.LeftCover = run.RightCover;
            run.LeftYear = run.RightYear;

            var next = await pool.PickAsync(run.UsedGameIds, run.LeftYear, ct);
            if (next is null)
            {
                run.Finished = true; // se acabaron los juegos: ¡partida perfecta!
            }
            else
            {
                run.RightGameId = next.Id;
                run.RightName = next.Name;
                run.RightCover = next.CoverUrl;
                run.RightYear = next.Year;
                run.UsedGameIds = [.. run.UsedGameIds, next.Id];
                nextRight = new OlderNewerGameDto(next.Id, next.Name, next.CoverUrl, null);
            }
        }
        else
        {
            run.Finished = true;
        }

        run.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var best = userId is null ? (int?)null : Math.Max(previousBest ?? 0, run.Score);
        var newRecord = userId is not null && run.Finished && run.Score > (previousBest ?? 0);
        return new OlderNewerGuessResultDto(correct, rightYear, run.Score, run.Finished, nextRight, best, newRecord);
    }

    /// <summary>Los 10 mejores récords.</summary>
    [HttpGet("leaderboard")]
    public async Task<ActionResult<List<OlderNewerLeaderDto>>> Leaderboard(CancellationToken ct)
    {
        var top = await db.OlderNewerRuns
            .Where(r => r.UserId != null && r.Score > 0)
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Best = g.Max(r => r.Score) })
            .OrderByDescending(x => x.Best)
            .Take(10)
            .ToListAsync(ct);

        var ids = top.Select(t => t.UserId).ToList();
        var users = await db.Users
            .Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.UserName, u.AvatarUpdatedAt })
            .ToDictionaryAsync(u => u.Id, ct);

        return top
            .Where(t => t.UserId is not null && users.ContainsKey(t.UserId))
            .Select(t =>
            {
                var u = users[t.UserId!];
                return new OlderNewerLeaderDto(u.UserName!, AvatarUrls.For(u.UserName!, u.AvatarUpdatedAt), t.Best);
            })
            .ToList();
    }

    private async Task<int> BestAsync(string userId, CancellationToken ct) =>
        await db.OlderNewerRuns.Where(r => r.UserId == userId).MaxAsync(r => (int?)r.Score, ct) ?? 0;
}
