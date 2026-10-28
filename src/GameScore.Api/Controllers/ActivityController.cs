using GameScore.Api.Data;
using GameScore.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

[ApiController]
[Route("api/activity")]
public class ActivityController(GameScoreDbContext db) : ControllerBase
{
    /// <summary>Últimas calificaciones de toda la comunidad.</summary>
    [HttpGet]
    public async Task<ActionResult<List<ActivityDto>>> Recent([FromQuery] int limit = 12, CancellationToken ct = default) =>
        await db.Ratings
            .OrderByDescending(r => r.UpdatedAt)
            .Take(Math.Clamp(limit, 1, 50))
            .Select(r => new ActivityDto(
                r.User.UserName!,
                r.User.DisplayName,
                r.User.AvatarUrl,
                r.Game.ExternalId,
                r.Game.Name,
                r.Game.CoverImage,
                r.Score,
                r.Review,
                r.UpdatedAt))
            .ToListAsync(ct);
}
