using GameScore.Api.Data;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

/// <summary>Subir, ver y quitar la foto de perfil.</summary>
[ApiController]
public class AvatarController(GameScoreDbContext db) : ControllerBase
{
    private const int MaxBytes = 1024 * 1024; // 1 MB (el frontend manda ~30 KB)

    public record AvatarResponse(string? AvatarUrl);

    [HttpGet("api/users/{userName}/avatar")]
    public async Task<IActionResult> Get(string userName, CancellationToken ct)
    {
        var normalized = userName.ToUpperInvariant();
        var avatar = await db.Set<UserAvatar>()
            .AsNoTracking()
            .Where(a => a.User.NormalizedUserName == normalized)
            .Select(a => new { a.Data, a.ContentType })
            .FirstOrDefaultAsync(ct);

        if (avatar is null) return NotFound();

        // La URL cambia (?v=) cada vez que se sube una foto nueva, así que se puede cachear mucho tiempo
        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        return File(avatar.Data, avatar.ContentType);
    }

    [Authorize]
    [HttpPut("api/me/avatar")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<AvatarResponse>> Upload(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return Problem(title: "No llegó ninguna imagen.", statusCode: StatusCodes.Status400BadRequest);
        if (file.Length > MaxBytes)
            return Problem(title: "La imagen es muy pesada (máximo 1 MB).", statusCode: StatusCodes.Status400BadRequest);

        using var memory = new MemoryStream();
        await file.CopyToAsync(memory, ct);
        var bytes = memory.ToArray();

        // No confiamos en el Content-Type que manda el navegador: miramos los primeros bytes
        var contentType = DetectImageType(bytes);
        if (contentType is null)
            return Problem(title: "El archivo no es una imagen JPG, PNG o WebP.", statusCode: StatusCodes.Status400BadRequest);

        var userId = User.GetRequiredUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return Unauthorized();

        var avatar = await db.Set<UserAvatar>().FirstOrDefaultAsync(a => a.UserId == userId, ct);
        if (avatar is null)
        {
            avatar = new UserAvatar { UserId = userId };
            db.Add(avatar);
        }

        var now = DateTime.UtcNow;
        avatar.Data = bytes;
        avatar.ContentType = contentType;
        avatar.UpdatedAt = now;
        user.AvatarUpdatedAt = now;

        await db.SaveChangesAsync(ct);
        return new AvatarResponse(AvatarUrls.For(user.UserName!, now));
    }

    [Authorize]
    [HttpDelete("api/me/avatar")]
    public async Task<IActionResult> Delete(CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        await db.Set<UserAvatar>().Where(a => a.UserId == userId).ExecuteDeleteAsync(ct);
        await db.Users.Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.AvatarUpdatedAt, (DateTime?)null), ct);
        return NoContent();
    }

    private static string? DetectImageType(byte[] b)
    {
        if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) return "image/jpeg";
        if (b.Length >= 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return "image/png";
        if (b.Length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
            && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
}
