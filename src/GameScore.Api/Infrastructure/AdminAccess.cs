namespace GameScore.Api.Infrastructure;

/// <summary>
/// Quién es administrador. La lista sale de la configuración (Admin:UserNames en appsettings.json)
/// y se compara con el nickname del usuario autenticado, sin distinguir mayúsculas.
/// </summary>
public class AdminAccess(IEnumerable<string> userNames)
{
    public const string Policy = "Admin";
    public const string Section = "Admin:UserNames";

    private readonly HashSet<string> _userNames = new(userNames, StringComparer.OrdinalIgnoreCase);

    public bool IsAdmin(string? userName) => userName is not null && _userNames.Contains(userName);
}
