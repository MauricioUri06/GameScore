using GameScore.Api.Data;
using GameScore.Api.Extensions;
using GameScore.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

/// <summary>Panel de administración: solo para los nicknames de Admin:UserNames.</summary>
[ApiController]
[Route("api/admin")]
[Authorize(Policy = AdminAccess.Policy)]
public class AdminController(GameScoreDbContext db) : ControllerBase
{
    public record CountByName(string Name, int Count);

    public record AdminStatsDto(
        int Users,
        int NewUsersLast7Days,
        int Ratings,
        int RatingsLast7Days,
        int ReviewsWithText,
        int GamesInDatabase,
        double? AverageScore,
        IReadOnlyList<CountByName> RatingsByPlatform,
        IReadOnlyList<CountByName> UsersByPlatform);

    public record AdminUserDto(
        string UserName,
        string? AvatarUrl,
        DateTime CreatedAt,
        int Ratings,
        int ReviewsWithText,
        double? AverageScore,
        DateTime? LastActivity,
        int TopGames,
        int FavoriteGenres,
        IReadOnlyList<string> Platforms,
        bool IsLockedOut,
        int FailedLoginAttempts);

    /// <summary>Números generales de la plataforma.</summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> Stats(CancellationToken ct)
    {
        var weekAgo = DateTime.UtcNow.AddDays(-7);

        var users = await db.Users.CountAsync(ct);
        var newUsers = await db.Users.CountAsync(u => u.CreatedAt >= weekAgo, ct);
        var ratings = await db.Ratings.CountAsync(ct);
        var ratingsWeek = await db.Ratings.CountAsync(r => r.UpdatedAt >= weekAgo, ct);
        var reviews = await db.Ratings.CountAsync(r => r.Review != null, ct);
        var games = await db.Games.CountAsync(ct);
        var average = await db.Ratings.AverageAsync(r => (double?)r.Score, ct);

        var byPlatform = await db.Ratings
            .GroupBy(r => r.Platform != null ? r.Platform.Name : "Sin plataforma")
            .Select(g => new CountByName(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        var usersByPlatform = await db.UserPlatforms
            .GroupBy(up => up.Platform.Name)
            .Select(g => new CountByName(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        return new AdminStatsDto(users, newUsers, ratings, ratingsWeek, reviews, games,
            average is null ? null : Math.Round(average.Value, 2), byPlatform, usersByPlatform);
    }

    /// <summary>Todos los usuarios con su actividad. Nunca incluye la clave ni su hash.</summary>
    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> Users(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        var users = await db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.UserName,
                u.AvatarUpdatedAt,
                u.CreatedAt,
                Ratings = u.Ratings.Count(),
                Reviews = u.Ratings.Count(r => r.Review != null),
                Average = u.Ratings.Average(r => (double?)r.Score),
                LastActivity = u.Ratings.Max(r => (DateTime?)r.UpdatedAt),
                TopGames = u.TopGames.Count(),
                FavoriteGenres = u.FavoriteGenres.Count(),
                Platforms = u.Platforms.OrderBy(p => p.Platform.SortOrder).Select(p => p.Platform.Name).ToList(),
                IsLockedOut = u.LockoutEnd != null && u.LockoutEnd > now,
                u.AccessFailedCount
            })
            .ToListAsync(ct);

        return users.Select(u => new AdminUserDto(
            u.UserName!,
            AvatarUrls.For(u.UserName!, u.AvatarUpdatedAt),
            u.CreatedAt,
            u.Ratings,
            u.Reviews,
            u.Average is null ? null : Math.Round(u.Average.Value, 2),
            u.LastActivity,
            u.TopGames,
            u.FavoriteGenres,
            u.Platforms,
            u.IsLockedOut,
            u.AccessFailedCount)).ToList();
    }
}
