using GameScore.Api.Data;
using GameScore.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

[ApiController]
[Route("api/platforms")]
public class PlatformsController(GameScoreDbContext db) : ControllerBase
{
    /// <summary>Todas las consolas/plataformas que se pueden marcar en el perfil.</summary>
    [HttpGet]
    public async Task<ActionResult<List<PlatformDto>>> GetAll(CancellationToken ct) =>
        await db.Platforms
            .OrderBy(p => p.SortOrder)
            .Select(p => new PlatformDto(p.Id, p.Name))
            .ToListAsync(ct);
}
