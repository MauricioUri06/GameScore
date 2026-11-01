using GameScore.Api.Data;
using GameScore.Api.Dtos;
using GameScore.Api.Extensions;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Services;

/// <summary>Mejor marca de un usuario en un minijuego.</summary>
public record UserBest(string UserId, double Best);

/// <summary>Arma el top 10 de un minijuego más el puesto del usuario actual.</summary>
public static class Leaderboards
{
    public const int TopSize = 10;

    /// <param name="lowerIsBetter">true cuando gana el menor valor (por ejemplo, un tiempo).</param>
    public static async Task<LeaderboardDto> BuildAsync(GameScoreDbContext db, IReadOnlyList<UserBest> bests,
        bool lowerIsBetter, string? currentUserId, CancellationToken ct)
    {
        var ordered = (lowerIsBetter ? bests.OrderBy(b => b.Best) : bests.OrderByDescending(b => b.Best)).ToList();
        var top = ordered.Take(TopSize).ToList();
        var mine = currentUserId is null ? null : ordered.FirstOrDefault(b => b.UserId == currentUserId);

        var ids = top.Select(t => t.UserId).Append(mine?.UserId).OfType<string>().Distinct().ToList();
        var users = await db.Users
            .Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.UserName, u.AvatarUpdatedAt })
            .ToDictionaryAsync(u => u.Id, ct);

        // Puesto = 1 + cuántos tienen una marca estrictamente mejor (los empates comparten puesto)
        int PositionOf(double best) => 1 + ordered.Count(b => lowerIsBetter ? b.Best < best : b.Best > best);

        LeaderDto? Make(UserBest b) => users.TryGetValue(b.UserId, out var u)
            ? new LeaderDto(PositionOf(b.Best), u.UserName!, AvatarUrls.For(u.UserName!, u.AvatarUpdatedAt),
                (int)Math.Ceiling(b.Best))
            : null;

        return new LeaderboardDto(top.Select(Make).OfType<LeaderDto>().ToList(), mine is null ? null : Make(mine));
    }
}
