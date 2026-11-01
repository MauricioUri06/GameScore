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
public class ProfilesController(GameScoreDbContext db, GameService games, MedalService medals) : ControllerBase
{
    /// <summary>Busca usuarios por nickname (contiene el texto, sin distinguir mayúsculas).</summary>
    [HttpGet("api/users")]
    public async Task<ActionResult<List<UserSearchDto>>> SearchUsers(
        [FromQuery] string? q, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var text = q?.Trim();
        if (string.IsNullOrEmpty(text) || text.Length < 2) return new List<UserSearchDto>();

        var upper = text.ToUpperInvariant();
        var users = await db.Users
            .AsNoTracking()
            .Where(u => u.NormalizedUserName!.Contains(upper))
            .OrderBy(u => u.NormalizedUserName!.StartsWith(upper) ? 0 : 1) // los que empiezan igual, primero
            .ThenBy(u => u.NormalizedUserName)
            .Take(Math.Clamp(limit, 1, 20))
            .Select(u => new { u.UserName, u.AvatarUpdatedAt, Ratings = u.Ratings.Count() })
            .ToListAsync(ct);

        return users
            .Select(u => new UserSearchDto(u.UserName!, AvatarUrls.For(u.UserName!, u.AvatarUpdatedAt), u.Ratings))
            .ToList();
    }

    /// <summary>Perfil público: top 5, géneros favoritos, plataformas, estadísticas y últimas calificaciones.</summary>
    [HttpGet("api/users/{userName}")]
    public async Task<ActionResult<ProfileDto>> GetProfile(string userName, CancellationToken ct)
    {
        var normalized = userName.ToUpperInvariant();
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.NormalizedUserName == normalized, ct);
        if (user is null) return NotFound();

        var topGames = await db.TopGames
            .Where(t => t.UserId == user.Id)
            .OrderBy(t => t.Position)
            .Select(t => new TopGameDto(t.Position, t.Game.ExternalId, t.Game.Slug, t.Game.Name, t.Game.CoverImage))
            .ToListAsync(ct);

        var favoriteGenres = await db.UserFavoriteGenres
            .Where(f => f.UserId == user.Id)
            .OrderBy(f => f.Genre.Name)
            .Select(f => new GenreDto(f.Genre.Id, f.Genre.Name, f.Genre.Slug))
            .ToListAsync(ct);

        var platforms = await db.UserPlatforms
            .Where(up => up.UserId == user.Id)
            .OrderBy(up => up.Platform.SortOrder)
            .Select(up => new PlatformDto(up.Platform.Id, up.Platform.Name, up.Platform.Family))
            .ToListAsync(ct);

        var ratingsQuery = db.Ratings.Where(r => r.UserId == user.Id);
        var ratingsCount = await ratingsQuery.CountAsync(ct);
        double? averageGiven = ratingsCount == 0
            ? null
            : Math.Round(await ratingsQuery.AverageAsync(r => (double)r.Score, ct), 2);

        var recent = await ratingsQuery
            .OrderByDescending(r => r.UpdatedAt)
            .Take(12)
            .Select(r => new ProfileRatingDto(
                r.Game.ExternalId, r.Game.Name, r.Game.CoverImage, r.Score, r.Review,
                r.Platform != null ? r.Platform.Name : null, r.UpdatedAt))
            .ToListAsync(ct);

        var playingRows = await db.CurrentlyPlaying
            .Where(p => p.UserId == user.Id)
            .OrderBy(p => p.Position)
            .Select(p => new { p.GameId, p.Game.ExternalId, p.Game.Name, p.Game.CoverImage, p.Game.Description, p.HoursPlayed })
            .ToListAsync(ct);
        var playingIds = playingRows.Select(p => p.GameId).ToList();
        var journal = await db.PlayingJournalEntries
            .Where(e => e.UserId == user.Id && playingIds.Contains(e.GameId))
            .Select(e => new { e.Id, e.GameId, e.Text, e.CreatedAt })
            .ToListAsync(ct);
        var journalByGame = journal.GroupBy(e => e.GameId).ToDictionary(g => g.Key, g => g.ToList());
        var playing = playingRows.Select(p =>
        {
            var entries = journalByGame.GetValueOrDefault(p.GameId) ?? [];
            var last = entries.MaxBy(e => e.CreatedAt);
            return new PlayingGameDto(p.ExternalId, p.Name, p.CoverImage,
                string.IsNullOrWhiteSpace(p.Description) ? null : p.Description, p.HoursPlayed,
                last is null ? null : new JournalEntryDto(last.Id, last.Text, last.CreatedAt), entries.Count);
        }).ToList();

        var reviewsCount = await ratingsQuery.CountAsync(r => r.Review != null, ct);
        var finishedCount = await db.FinishedGames.CountAsync(f => f.UserId == user.Id, ct);
        var olderNewerBest = await db.OlderNewerRuns.Where(r => r.UserId == user.Id).MaxAsync(r => (int?)r.Score, ct) ?? 0;
        var allMedals = await medals.GetMedalsAsync(user.Id, ct);
        var earnedById = allMedals.Where(m => m.Earned).ToDictionary(m => m.Id);
        var showcaseIds = await db.UserShowcaseMedals
            .Where(m => m.UserId == user.Id)
            .OrderBy(m => m.Position)
            .Select(m => m.MedalId)
            .ToListAsync(ct);
        // Solo las elegidas que sigan obtenidas
        var showcase = showcaseIds.Where(earnedById.ContainsKey).Select(id => earnedById[id]).ToList();

        return new ProfileDto(
            user.UserName!,
            AvatarUrls.For(user.UserName!, user.AvatarUpdatedAt),
            user.CreatedAt,
            ratingsCount,
            averageGiven,
            topGames,
            favoriteGenres,
            platforms,
            recent,
            playing,
            showcase,
            earnedById.Count,
            allMedals.Count,
            reviewsCount,
            finishedCount,
            olderNewerBest);
    }

    /// <summary>Juegos terminados de un usuario (lo más reciente primero).</summary>
    [HttpGet("api/users/{userName}/finished")]
    public async Task<ActionResult<List<FinishedGameDto>>> GetFinished(string userName, CancellationToken ct)
    {
        var normalized = userName.ToUpperInvariant();
        var userId = await db.Users.Where(u => u.NormalizedUserName == normalized).Select(u => u.Id).FirstOrDefaultAsync(ct);
        if (userId is null) return NotFound();

        var rows = await db.FinishedGames
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.FinishedAt)
            .Select(f => new
            {
                f.GameId,
                f.Game.ExternalId,
                f.Game.Name,
                f.Game.CoverImage,
                f.FinishedAt,
                f.HoursPlayed,
                Score = db.Ratings.Where(r => r.UserId == userId && r.GameId == f.GameId).Select(r => (double?)r.Score).FirstOrDefault(),
                JournalCount = db.PlayingJournalEntries.Count(e => e.UserId == userId && e.GameId == f.GameId),
            })
            .ToListAsync(ct);

        return rows.Select(f => new FinishedGameDto(f.ExternalId, f.Name, f.CoverImage, f.FinishedAt, f.HoursPlayed,
            f.Score, f.JournalCount)).ToList();
    }

    /// <summary>Marca como terminado un juego de "Jugando ahora": sale de esa lista y pasa a "Juegos terminados".</summary>
    [Authorize]
    [HttpPost("api/me/playing/{gameId:int}/finish")]
    public async Task<IActionResult> FinishPlaying(int gameId, CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        var row = await db.CurrentlyPlaying.FirstOrDefaultAsync(p => p.UserId == userId && p.Game.ExternalId == gameId, ct);
        if (row is null) return NotFound();

        var finished = await db.FinishedGames.FirstOrDefaultAsync(f => f.UserId == userId && f.GameId == row.GameId, ct);
        if (finished is null)
        {
            db.FinishedGames.Add(new FinishedGame { UserId = userId, GameId = row.GameId, HoursPlayed = row.HoursPlayed });
        }
        else
        {
            // Ya lo había terminado antes (lo volvió a jugar): se actualiza la fecha y se suman las horas
            finished.FinishedAt = DateTime.UtcNow;
            finished.HoursPlayed += row.HoursPlayed;
        }

        db.CurrentlyPlaying.Remove(row);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Quita un juego de tus terminados.</summary>
    [Authorize]
    [HttpDelete("api/me/finished/{gameId:int}")]
    public async Task<IActionResult> DeleteFinished(int gameId, CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        var deleted = await db.FinishedGames
            .Where(f => f.UserId == userId && f.Game.ExternalId == gameId)
            .ExecuteDeleteAsync(ct);
        return deleted == 0 ? NotFound() : NoContent();
    }

    /// <summary>Todas las medallas de un usuario, obtenidas y por obtener, con su progreso.</summary>
    [HttpGet("api/users/{userName}/medals")]
    public async Task<ActionResult<List<MedalDto>>> GetMedals(string userName, CancellationToken ct)
    {
        var normalized = userName.ToUpperInvariant();
        var userId = await db.Users.Where(u => u.NormalizedUserName == normalized).Select(u => u.Id).FirstOrDefaultAsync(ct);
        if (userId is null) return NotFound();
        return await medals.GetMedalsAsync(userId, ct);
    }

    /// <summary>Elige qué medallas obtenidas se muestran en el perfil (máximo 10, en el orden recibido).</summary>
    [Authorize]
    [HttpPut("api/me/medals")]
    public async Task<IActionResult> UpdateShowcaseMedals(UpdateShowcaseMedalsRequest request, CancellationToken ct)
    {
        const int max = 10;
        var ids = (request.MedalIds ?? []).Distinct().ToList();
        if (ids.Count > max)
        {
            ModelState.AddModelError(nameof(request.MedalIds), $"Puedes mostrar hasta {max} medallas.");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetRequiredUserId();
        var earned = (await medals.GetMedalsAsync(userId, ct)).Where(m => m.Earned).Select(m => m.Id).ToHashSet();
        var notEarned = ids.FirstOrDefault(id => !earned.Contains(id));
        if (notEarned is not null)
        {
            ModelState.AddModelError(nameof(request.MedalIds), "Solo puedes mostrar medallas que ya obtuviste.");
            return ValidationProblem(ModelState);
        }

        await db.UserShowcaseMedals.Where(m => m.UserId == userId).ExecuteDeleteAsync(ct);
        db.UserShowcaseMedals.AddRange(ids.Select((id, i) =>
            new UserShowcaseMedal { UserId = userId, MedalId = id, Position = i + 1 }));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Reemplaza la lista de "Jugando ahora" (máximo 10, en el orden recibido).</summary>
    [Authorize]
    [HttpPut("api/me/playing")]
    public async Task<IActionResult> UpdatePlaying(UpdatePlayingRequest request, CancellationToken ct)
    {
        const int max = 10;
        var gameIds = (request.GameIds ?? []).Distinct().ToList();
        if (gameIds.Count > max)
        {
            ModelState.AddModelError(nameof(request.GameIds), $"Máximo {max} juegos en \"Jugando ahora\".");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetRequiredUserId();
        var existing = await db.CurrentlyPlaying.Where(p => p.UserId == userId).ToListAsync(ct);
        var keep = new HashSet<int>();
        for (var i = 0; i < gameIds.Count; i++)
        {
            var game = await games.EnsureCachedAsync(gameIds[i], ct);
            if (game is null)
            {
                ModelState.AddModelError(nameof(request.GameIds), $"No existe el juego {gameIds[i]}.");
                return ValidationProblem(ModelState);
            }

            keep.Add(game.Id);
            var row = existing.FirstOrDefault(p => p.GameId == game.Id);
            if (row is null)
                db.CurrentlyPlaying.Add(new CurrentlyPlaying { UserId = userId, GameId = game.Id, Position = i + 1 });
            else
                row.Position = i + 1; // se conservan las horas jugadas
        }

        db.CurrentlyPlaying.RemoveRange(existing.Where(p => !keep.Contains(p.GameId)));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Suma (o resta, para corregir) horas jugadas a un juego de "Jugando ahora".</summary>
    [Authorize]
    [HttpPost("api/me/playing/{gameId:int}/hours")]
    public async Task<ActionResult<HoursDto>> AddHours(int gameId, AddHoursRequest request, CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        var row = await db.CurrentlyPlaying.FirstOrDefaultAsync(p => p.UserId == userId && p.Game.ExternalId == gameId, ct);
        if (row is null) return NotFound();

        row.HoursPlayed = Math.Clamp(Math.Round(row.HoursPlayed + request.Hours, 1), 0, 100_000);
        await db.SaveChangesAsync(ct);
        return new HoursDto(row.HoursPlayed);
    }

    /// <summary>Diario completo de un juego de un usuario (lo más nuevo primero).</summary>
    [HttpGet("api/users/{userName}/journal/{gameId:int}")]
    public async Task<ActionResult<List<JournalEntryDto>>> GetJournal(string userName, int gameId, CancellationToken ct)
    {
        var normalized = userName.ToUpperInvariant();
        var userId = await db.Users.Where(u => u.NormalizedUserName == normalized).Select(u => u.Id).FirstOrDefaultAsync(ct);
        if (userId is null) return NotFound();

        var rows = await db.PlayingJournalEntries
            .Where(e => e.UserId == userId && e.Game.ExternalId == gameId)
            .OrderByDescending(e => e.CreatedAt)
            .Take(100)
            .Select(e => new { e.Id, e.Text, e.CreatedAt })
            .ToListAsync(ct);
        return rows.Select(e => new JournalEntryDto(e.Id, e.Text, e.CreatedAt)).ToList();
    }

    /// <summary>Agrega una entrada al diario de un juego que estás jugando.</summary>
    [Authorize]
    [HttpPost("api/me/playing/{gameId:int}/journal")]
    public async Task<ActionResult<JournalEntryDto>> AddJournalEntry(int gameId, AddJournalEntryRequest request, CancellationToken ct)
    {
        var text = request.Text.Trim();
        if (text.Length == 0)
        {
            ModelState.AddModelError(nameof(request.Text), "Escribe algo en el diario.");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetRequiredUserId();
        var internalId = await db.CurrentlyPlaying
            .Where(p => p.UserId == userId && p.Game.ExternalId == gameId)
            .Select(p => (int?)p.GameId)
            .FirstOrDefaultAsync(ct);
        if (internalId is null) return NotFound();

        var entry = new PlayingJournalEntry { UserId = userId, GameId = internalId.Value, Text = text };
        db.PlayingJournalEntries.Add(entry);
        await db.SaveChangesAsync(ct);
        return new JournalEntryDto(entry.Id, entry.Text, entry.CreatedAt);
    }

    /// <summary>Borra una entrada de tu diario.</summary>
    [Authorize]
    [HttpDelete("api/me/journal/{entryId:int}")]
    public async Task<IActionResult> DeleteJournalEntry(int entryId, CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        var deleted = await db.PlayingJournalEntries
            .Where(e => e.Id == entryId && e.UserId == userId)
            .ExecuteDeleteAsync(ct);
        return deleted == 0 ? NotFound() : NoContent();
    }

    /// <summary>Reemplaza el top 5. El orden de la lista define la posición (1 a 5).</summary>
    [Authorize]
    [HttpPut("api/me/top-games")]
    public async Task<IActionResult> UpdateTopGames(UpdateTopGamesRequest request, CancellationToken ct)
    {
        var gameIds = request.GameIds ?? [];
        if (gameIds.Count > 5 || gameIds.Distinct().Count() != gameIds.Count)
        {
            ModelState.AddModelError(nameof(request.GameIds), "Máximo 5 juegos y sin repetir.");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetRequiredUserId();

        var newEntries = new List<TopGame>();
        for (var i = 0; i < gameIds.Count; i++)
        {
            var game = await games.EnsureCachedAsync(gameIds[i], ct);
            if (game is null)
            {
                ModelState.AddModelError(nameof(request.GameIds), $"No existe el juego {gameIds[i]}.");
                return ValidationProblem(ModelState);
            }

            newEntries.Add(new TopGame { UserId = userId, Position = i + 1, GameId = game.Id });
        }

        await db.TopGames.Where(t => t.UserId == userId).ExecuteDeleteAsync(ct);
        db.TopGames.AddRange(newEntries);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    [Authorize]
    [HttpPut("api/me/favorite-genres")]
    public async Task<IActionResult> UpdateFavoriteGenres(UpdateFavoriteGenresRequest request, CancellationToken ct)
    {
        // Sin límite: se pueden elegir todas las categorías que se quiera
        var genreIds = (request.GenreIds ?? []).Distinct().ToList();

        var validIds = await db.Genres.Where(g => genreIds.Contains(g.Id)).Select(g => g.Id).ToListAsync(ct);
        var userId = User.GetRequiredUserId();

        await db.UserFavoriteGenres.Where(f => f.UserId == userId).ExecuteDeleteAsync(ct);
        db.UserFavoriteGenres.AddRange(validIds.Select(id => new UserFavoriteGenre { UserId = userId, GenreId = id }));
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    /// <summary>Reemplaza las plataformas/consolas que el usuario dice tener.</summary>
    [Authorize]
    [HttpPut("api/me/platforms")]
    public async Task<IActionResult> UpdatePlatforms(UpdatePlatformsRequest request, CancellationToken ct)
    {
        var requested = (request.PlatformIds ?? []).Distinct().ToList();
        var validIds = await db.Platforms.Where(p => requested.Contains(p.Id)).Select(p => p.Id).ToListAsync(ct);
        var userId = User.GetRequiredUserId();

        await db.UserPlatforms.Where(up => up.UserId == userId).ExecuteDeleteAsync(ct);
        db.UserPlatforms.AddRange(validIds.Select(id => new UserPlatform { UserId = userId, PlatformId = id }));
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
