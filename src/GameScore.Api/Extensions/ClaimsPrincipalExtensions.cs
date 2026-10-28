using System.Security.Claims;

namespace GameScore.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Id del usuario autenticado, o null si es anónimo.</summary>
    public static string? GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>Id del usuario autenticado. Usar solo en endpoints con [Authorize].</summary>
    public static string GetRequiredUserId(this ClaimsPrincipal user) =>
        user.GetUserId() ?? throw new UnauthorizedAccessException();
}
