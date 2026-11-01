using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

/// <summary>
/// Minijuego "Categorías" (1 jugador). Sale una categoría y hay que elegir un juego que la tenga.
/// Puntos según la rapidez: 100 al instante, 10 a los 30 segundos. Meta: 1000 puntos. 3 vidas.
/// </summary>
[ApiController]
[Route("api/category-game")]
public class CategoryGameController(GameScoreDbContext db, GameService games) : ControllerBase
{
    public const int Goal = 1000;
    public const int SecondsPerRound = 30;
    public const int StartingLives = 3;
    private const int MaxPoints = 100;
    private const int MinPoints = 10;
    private static readonly TimeSpan Grace = TimeSpan.FromSeconds(3);

    [HttpPost("start")]
    public async Task<ActionResult<CategoryStateDto>> Start(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var yesterday = DateTime.UtcNow.AddDays(-1);
        await db.CategoryRuns.Where(r => r.UserId == null && r.UpdatedAt < yesterday).ExecuteDeleteAsync(ct);

        var genre = await PickGenreAsync([], ct);
        if (genre is null) return Problem("No hay categorías disponibles.", statusCode: 503);

        var run = new CategoryRun
        {
            UserId = userId,
            Lives = StartingLives,
            GenreId = genre.Id,
            GenreName = genre.Name,
            UsedGenreIds = [genre.Id]
        };
        db.CategoryRuns.Add(run);
        await db.SaveChangesAsync(ct);
        return await StateAsync(run, ct);
    }

    /// <summary>Responde con un juego (id de IGDB, elegido del buscador).</summary>
    [HttpPost("{runId:guid}/answer")]
    public async Task<ActionResult<CategoryAnswerResultDto>> Answer(Guid runId, CategoryAnswerRequest request, CancellationToken ct)
    {
        var run = await FindRunAsync(runId, ct);
        if (run is null) return NotFound();
        if (run.Finished || run.RoundOver) return Conflict(new { message = "Esta ronda ya terminó." });

        var elapsed = Elapsed(run);
        if (elapsed > TimeSpan.FromSeconds(SecondsPerRound) + Grace)
            return await LoseRoundAsync(run, timedOut: true, gameName: null, gameId: null, ct);

        // Un juego ya usado en la partida no cuenta, pero tampoco castiga: se puede elegir otro
        if (run.UsedGameIds.Contains(request.GameId))
            return new CategoryAnswerResultDto(false, true, false, 0, null, null, await StateAsync(run, ct));

        var game = await games.EnsureCachedAsync(request.GameId, ct);
        if (game is null) return NotFound(new { message = "No existe ese juego." });

        run.UsedGameIds = [.. run.UsedGameIds, request.GameId];
        if (!game.Genres.Any(g => g.Id == run.GenreId))
            return await LoseRoundAsync(run, timedOut: false, game.Name, request.GameId, ct);

        var seconds = Math.Min(elapsed.TotalSeconds, SecondsPerRound);
        var points = (int)Math.Round(MaxPoints - (MaxPoints - MinPoints) * seconds / SecondsPerRound);
        run.Score += points;
        run.TotalSeconds += seconds;
        run.RoundOver = true;
        if (run.Score >= Goal)
        {
            run.Finished = true;
            run.Won = true;
        }

        var newRecord = await SaveAndCheckRecordAsync(run, ct);
        return new CategoryAnswerResultDto(true, false, false, points, game.Name, request.GameId, await StateAsync(run, ct), newRecord);
    }

    /// <summary>Se acabó el tiempo (o el jugador se rinde): pierde una vida.</summary>
    [HttpPost("{runId:guid}/timeout")]
    public async Task<ActionResult<CategoryAnswerResultDto>> Timeout(Guid runId, CancellationToken ct)
    {
        var run = await FindRunAsync(runId, ct);
        if (run is null) return NotFound();
        if (run.Finished || run.RoundOver) return Conflict(new { message = "Esta ronda ya terminó." });
        return await LoseRoundAsync(run, timedOut: true, gameName: null, gameId: null, ct);
    }

    /// <summary>Siguiente ronda, con una categoría nueva.</summary>
    [HttpPost("{runId:guid}/next")]
    public async Task<ActionResult<CategoryStateDto>> Next(Guid runId, CancellationToken ct)
    {
        var run = await FindRunAsync(runId, ct);
        if (run is null) return NotFound();
        if (run.Finished) return Conflict(new { message = "La partida ya terminó." });
        if (!run.RoundOver) return await StateAsync(run, ct);

        var genre = await PickGenreAsync(run.UsedGenreIds, ct);
        if (genre is null) return Problem("No hay categorías disponibles.", statusCode: 503);

        run.Round++;
        run.RoundOver = false;
        run.GenreId = genre.Id;
        run.GenreName = genre.Name;
        // Cuando ya salieron todas las categorías, se vuelve a empezar la lista
        run.UsedGenreIds = run.UsedGenreIds.Contains(genre.Id) ? [genre.Id] : [.. run.UsedGenreIds, genre.Id];
        run.RoundStartedAt = DateTime.UtcNow;
        run.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await StateAsync(run, ct);
    }

    /// <summary>Los 10 mejores tiempos para llegar a 1000.</summary>
    [HttpGet("leaderboard")]
    public async Task<ActionResult<List<LeaderDto>>> Leaderboard(CancellationToken ct)
    {
        var top = await db.CategoryRuns
            .Where(r => r.UserId != null && r.Won)
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Best = g.Min(r => r.TotalSeconds) })
            .OrderBy(x => x.Best)
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
                return new LeaderDto(u.UserName!, AvatarUrls.For(u.UserName!, u.AvatarUpdatedAt), (int)Math.Ceiling(t.Best));
            })
            .ToList();
    }

    // ---------- Ayudantes ----------

    private async Task<CategoryRun?> FindRunAsync(Guid runId, CancellationToken ct)
    {
        var run = await db.CategoryRuns.FirstOrDefaultAsync(r => r.Id == runId, ct);
        return run is null || run.UserId != User.GetUserId() ? null : run;
    }

    private static TimeSpan Elapsed(CategoryRun run) => DateTime.UtcNow - run.RoundStartedAt;

    private async Task<Genre?> PickGenreAsync(int[] used, CancellationToken ct)
    {
        var all = await db.Genres.AsNoTracking().ToListAsync(ct);
        if (all.Count == 0) return null;
        var options = all.Where(g => !used.Contains(g.Id)).ToList();
        if (options.Count == 0) options = all;
        return options[Random.Shared.Next(options.Count)];
    }

    private async Task<ActionResult<CategoryAnswerResultDto>> LoseRoundAsync(
        CategoryRun run, bool timedOut, string? gameName, int? gameId, CancellationToken ct)
    {
        run.Lives--;
        run.RoundOver = true;
        run.TotalSeconds += SecondsPerRound;
        if (run.Lives <= 0) run.Finished = true;

        await SaveAndCheckRecordAsync(run, ct);
        return new CategoryAnswerResultDto(false, false, timedOut, 0, gameName, gameId, await StateAsync(run, ct));
    }

    /// <summary>Guarda y dice si esta partida es el nuevo mejor tiempo del usuario.</summary>
    private async Task<bool> SaveAndCheckRecordAsync(CategoryRun run, CancellationToken ct)
    {
        run.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        if (run.UserId is null || !run.Won) return false;

        var previous = await db.CategoryRuns
            .Where(r => r.UserId == run.UserId && r.Won && r.Id != run.Id)
            .MinAsync(r => (double?)r.TotalSeconds, ct);
        return previous is null || run.TotalSeconds < previous;
    }

    private async Task<CategoryStateDto> StateAsync(CategoryRun run, CancellationToken ct)
    {
        int? best = null;
        if (run.UserId is not null)
        {
            var seconds = await db.CategoryRuns.Where(r => r.UserId == run.UserId && r.Won)
                .MinAsync(r => (double?)r.TotalSeconds, ct);
            best = seconds is null ? null : (int)Math.Ceiling(seconds.Value);
        }

        return new CategoryStateDto(run.Id, run.Round, run.Score, Goal, run.Lives, StartingLives, run.GenreName,
            SecondsPerRound, MaxPoints, MinPoints, run.RoundOver, run.Finished, run.Won,
            (int)Math.Ceiling(run.TotalSeconds), best);
    }
}
