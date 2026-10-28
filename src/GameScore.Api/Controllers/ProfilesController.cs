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
public class ProfilesController(GameScoreDbContext db, GameService games) : ControllerBase
{
    /// <summary>Perfil público: top 5, géneros favoritos, estadísticas y últimas calificaciones.</summary>
    [HttpGet("api/users/{userName}")]
    public async Task<ActionResult<ProfileDto>> GetProfile(string userName, CancellationToken ct)
    {
        var normalized = userName.ToUpperInvariant();
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.NormalizedUserName == normalized, ct);
        if (user is null) return NotFound();

        var topGames = await db.TopGames
            .Where(t => t.UserId == user.Id)
            .OrderBy(t => t.Position)
            .Select(t => new TopGameDto(t.Position, t.Game.RawgId, t.Game.Slug, t.Game.Name, t.Game.BackgroundImage))
            .ToListAsync(ct);

        var favoriteGenres = await db.UserFavoriteGenres
            .Where(f => f.UserId == user.Id)
            .OrderBy(f => f.Genre.Name)
            .Select(f => new GenreDto(f.Genre.Id, f.Genre.Name, f.Genre.Slug))
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
                r.Game.RawgId, r.Game.Name, r.Game.BackgroundImage, r.Score, r.Review, r.UpdatedAt))
            .ToListAsync(ct);

        return new ProfileDto(
            user.UserName!,
            user.DisplayName,
            user.Bio,
            user.AvatarUrl,
            user.CreatedAt,
            ratingsCount,
            averageGiven,
            topGames,
            favoriteGenres,
            recent);
    }

    [Authorize]
    [HttpPut("api/me/profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return Unauthorized();

        user.DisplayName = request.DisplayName.Trim();
        user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Reemplaza el top 5. El orden de la lista define la posición (1 a 5).</summary>
    [Authorize]
    [HttpPut("api/me/top-games")]
    public async Task<IActionResult> UpdateTopGames(UpdateTopGamesRequest request, CancellationToken ct)
    {
        var rawgIds = request.RawgIds ?? [];
        if (rawgIds.Count > 5 || rawgIds.Distinct().Count() != rawgIds.Count)
        {
            ModelState.AddModelError(nameof(request.RawgIds), "Máximo 5 juegos y sin repetir.");
            return ValidationProblem(ModelState);
        }

        var userId = User.GetRequiredUserId();

        var newEntries = new List<TopGame>();
        for (var i = 0; i < rawgIds.Count; i++)
        {
            var game = await games.EnsureCachedAsync(rawgIds[i], ct);
            if (game is null)
            {
                ModelState.AddModelError(nameof(request.RawgIds), $"No existe el juego {rawgIds[i]}.");
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
        var genreIds = (request.GenreIds ?? []).Distinct().ToList();
        if (genreIds.Count > 5)
        {
            ModelState.AddModelError(nameof(request.GenreIds), "Máximo 5 géneros.");
            return ValidationProblem(ModelState);
        }

        var validIds = await db.Genres.Where(g => genreIds.Contains(g.Id)).Select(g => g.Id).ToListAsync(ct);
        var userId = User.GetRequiredUserId();

        await db.UserFavoriteGenres.Where(f => f.UserId == userId).ExecuteDeleteAsync(ct);
        db.UserFavoriteGenres.AddRange(validIds.Select(id => new UserFavoriteGenre { UserId = userId, GenreId = id }));
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
