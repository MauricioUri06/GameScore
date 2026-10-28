using GameScore.Api.Dtos;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GameScore.Api.Controllers;

[ApiController]
[Route("api/genres")]
public class GenresController(GameService games) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<GenreDto>>> GetAll(CancellationToken ct) =>
        await games.GetGenresAsync(ct);
}
