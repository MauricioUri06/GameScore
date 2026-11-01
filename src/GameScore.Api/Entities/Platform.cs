namespace GameScore.Api.Entities;

/// <summary>Consola o plataforma que un usuario puede marcar como "la tengo" en su perfil.</summary>
public class Platform
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>Grupo para mostrarlas juntas: PC, PlayStation, Xbox, Nintendo u Otras.</summary>
    public string Family { get; set; } = string.Empty;

    public int SortOrder { get; set; }
}

public class UserPlatform
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int PlatformId { get; set; }
    public Platform Platform { get; set; } = null!;
}
