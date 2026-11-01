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

        var playing = await db.CurrentlyPlaying
            .Where(p => p.UserId == user.Id)
            .OrderBy(p => p.Position)
            .Select(p => new PlayingGameDto(p.Game.ExternalId, p.Game.Name, p.Game.CoverImage))
            .ToListAsync(ct);

        var reviewsCount = await ratingsQuery.CountAsync(r => r.Review != null, ct);
        var allMedals = await medals.GetMedalsAsync(user.Id, ct);

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
            allMedals.Where(m => m.Earned).ToList(),
            allMedals.Count,
            reviewsCount);
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
        var entries = new List<CurrentlyPlaying>();
        for (var i = 0; i < gameIds.Count; i++)
        {
            var game = await games.EnsureCachedAsync(gameIds[i], ct);
            if (game is null)
            {
                ModelState.AddModelError(nameof(request.GameIds), $"No existe el juego {gameIds[i]}.");
                return ValidationProblem(ModelState);
            }
            entries.Add(new CurrentlyPlaying { UserId = userId, GameId = game.Id, Position = i + 1 });
        }

        await db.CurrentlyPlaying.Where(p => p.UserId == userId).ExecuteDeleteAsync(ct);
        db.CurrentlyPlaying.AddRange(entries);
        await db.SaveChangesAsync(ct);
        return NoContent();
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
