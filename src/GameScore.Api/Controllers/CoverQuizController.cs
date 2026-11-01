using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

/// <summary>
/// Minijuego "Adivina la portada": 10 rondas, 4 intentos y 30 segundos por ronda.
/// Menos intentos = más puntos. Con sesión iniciada se guarda el récord.
/// </summary>
[ApiController]
[Route("api/cover-quiz")]
public class CoverQuizController(GameScoreDbContext db, OlderNewerPool pool, CoverImageService covers) : ControllerBase
{
    public const int TotalRounds = 10;
    public const int SecondsPerRound = 30;
    private static readonly int[] PointsByAttempt = [100, 70, 40, 20];
    private static int MaxAttempts => PointsByAttempt.Length;
    private static readonly TimeSpan Grace = TimeSpan.FromSeconds(3);

    /// <summary>Empieza una partida nueva.</summary>
    [HttpPost("start")]
    public async Task<ActionResult<CoverQuizStateDto>> Start(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var yesterday = DateTime.UtcNow.AddDays(-1);
        await db.CoverQuizRuns.Where(r => r.UserId == null && r.UpdatedAt < yesterday).ExecuteDeleteAsync(ct);

        var game = await pool.PickAsync([], null, ct);
        if (game is null || game.CoverUrl is null) return Problem("No hay juegos disponibles para jugar.", statusCode: 503);

        var run = new CoverQuizRun
        {
            UserId = userId,
            GameId = game.Id,
            GameName = game.Name,
            CoverUrl = game.CoverUrl,
            UsedGameIds = [game.Id]
        };
        db.CoverQuizRuns.Add(run);
        await db.SaveChangesAsync(ct);
        return await StateAsync(run, ct);
    }

    /// <summary>Portada de la ronda actual: borrosa mientras se adivina, nítida cuando la ronda terminó.</summary>
    [HttpGet("{runId:guid}/image")]
    public async Task<IActionResult> Image(Guid runId, CancellationToken ct)
    {
        var run = await db.CoverQuizRuns.AsNoTracking().FirstOrDefaultAsync(r => r.Id == runId, ct);
        // La imagen la pide una etiqueta <img>, que no manda el token: basta con conocer el id (secreto) de la partida
        if (run is null) return NotFound();

        var bytes = await covers.GetAsync(run.CoverUrl, run.RoundOver || run.Finished ? null : run.Attempts, ct);
        Response.Headers.CacheControl = "no-store";
        return File(bytes, "image/jpeg");
    }

    /// <summary>Intenta adivinar el nombre del juego.</summary>
    [HttpPost("{runId:guid}/guess")]
    public async Task<ActionResult<CoverQuizGuessResultDto>> Guess(Guid runId, CoverQuizGuessRequest request, CancellationToken ct)
    {
        var run = await FindRunAsync(runId, ct);
        if (run is null) return NotFound();
        if (run.Finished || run.RoundOver) return Conflict(new { message = "Esta ronda ya terminó." });

        var timedOut = IsTimedOut(run);
        var correct = !timedOut && TitleMatcher.Matches(request.Text, run.GameName);
        var points = 0;

        if (correct)
        {
            points = PointsByAttempt[run.Attempts];
            run.Score += points;
            run.RoundOver = true;
        }
        else if (timedOut)
        {
            run.RoundOver = true;
        }
        else
        {
            run.Attempts++;
            if (run.Attempts >= MaxAttempts) run.RoundOver = true;
        }

        return await FinishTurnAsync(run, correct, timedOut, points, ct);
    }

    /// <summary>Se rinde en la ronda actual (o se le acabó el tiempo): 0 puntos y se revela el juego.</summary>
    [HttpPost("{runId:guid}/skip")]
    public async Task<ActionResult<CoverQuizGuessResultDto>> Skip(Guid runId, CancellationToken ct)
    {
        var run = await FindRunAsync(runId, ct);
        if (run is null) return NotFound();
        if (run.Finished || run.RoundOver) return Conflict(new { message = "Esta ronda ya terminó." });

        var timedOut = IsTimedOut(run);
        run.RoundOver = true;
        return await FinishTurnAsync(run, false, timedOut, 0, ct);
    }

    /// <summary>Pasa a la siguiente ronda (después de ver la respuesta).</summary>
    [HttpPost("{runId:guid}/next")]
    public async Task<ActionResult<CoverQuizStateDto>> Next(Guid runId, CancellationToken ct)
    {
        var run = await FindRunAsync(runId, ct);
        if (run is null) return NotFound();
        if (run.Finished) return Conflict(new { message = "La partida ya terminó." });
        if (!run.RoundOver) return await StateAsync(run, ct);

        var game = await pool.PickAsync(run.UsedGameIds, null, ct);
        if (game is null || game.CoverUrl is null)
        {
            run.Finished = true;
        }
        else
        {
            run.Round++;
            run.Attempts = 0;
            run.RoundOver = false;
            run.GameId = game.Id;
            run.GameName = game.Name;
            run.CoverUrl = game.CoverUrl;
            run.UsedGameIds = [.. run.UsedGameIds, game.Id];
            run.RoundStartedAt = DateTime.UtcNow;
        }

        run.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await StateAsync(run, ct);
    }

    /// <summary>Los 10 mejores récords y tu puesto.</summary>
    [HttpGet("leaderboard")]
    public async Task<ActionResult<LeaderboardDto>> Leaderboard(CancellationToken ct)
    {
        var bests = await db.CoverQuizRuns
            .Where(r => r.UserId != null && r.Score > 0)
            .GroupBy(r => r.UserId!)
            .Select(g => new { UserId = g.Key, Best = g.Max(r => r.Score) })
            .ToListAsync(ct);
        return await Leaderboards.BuildAsync(db, bests.Select(b => new UserBest(b.UserId, b.Best)).ToList(),
            lowerIsBetter: false, User.GetUserId(), ct);
    }

    // ---------- Ayudantes ----------

    private async Task<CoverQuizRun?> FindRunAsync(Guid runId, CancellationToken ct)
    {
        var run = await db.CoverQuizRuns.FirstOrDefaultAsync(r => r.Id == runId, ct);
        return run is null || run.UserId != User.GetUserId() ? null : run;
    }

    private static bool IsTimedOut(CoverQuizRun run) =>
        DateTime.UtcNow - run.RoundStartedAt > TimeSpan.FromSeconds(SecondsPerRound) + Grace;

    private async Task<ActionResult<CoverQuizGuessResultDto>> FinishTurnAsync(
        CoverQuizRun run, bool correct, bool timedOut, int points, CancellationToken ct)
    {
        int previousBest = 0;
        if (run.UserId is not null)
            previousBest = await db.CoverQuizRuns.Where(r => r.UserId == run.UserId && r.Id != run.Id)
                .MaxAsync(r => (int?)r.Score, ct) ?? 0;

        if (run.RoundOver && run.Round >= TotalRounds) run.Finished = true;
        run.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var newRecord = run.UserId is not null && run.Finished && run.Score > previousBest;
        var reveal = run.RoundOver || run.Finished;
        return new CoverQuizGuessResultDto(correct, timedOut, points,
            reveal ? run.GameName : null,
            reveal ? run.GameId : null,
            reveal ? run.CoverUrl : null,
            newRecord,
            await StateAsync(run, ct));
    }

    private async Task<CoverQuizStateDto> StateAsync(CoverQuizRun run, CancellationToken ct)
    {
        int? best = run.UserId is null
            ? null
            : await db.CoverQuizRuns.Where(r => r.UserId == run.UserId).MaxAsync(r => (int?)r.Score, ct) ?? 0;

        var elapsed = (int)(DateTime.UtcNow - run.RoundStartedAt).TotalSeconds;
        var hint = run.RoundOver || run.Finished
            ? run.GameName
            : TitleMatcher.Hint(run.GameName, run.Attempts, run.Id.GetHashCode() ^ (run.Round * 397));
        // El número de intentos/ronda en la URL evita que el navegador reutilice una imagen vieja
        var imageUrl = $"/api/cover-quiz/{run.Id}/image?r={run.Round}&a={run.Attempts}&o={(run.RoundOver ? 1 : 0)}";

        return new CoverQuizStateDto(run.Id, run.Round, TotalRounds, run.Score, run.Attempts, MaxAttempts, hint, imageUrl,
            Math.Max(0, SecondsPerRound - elapsed), SecondsPerRound, run.RoundOver, run.Finished, best, PointsByAttempt);
    }
}
