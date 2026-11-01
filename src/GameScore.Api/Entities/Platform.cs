namespace GameScore.Api.Entities;

/// <summary>Plataforma que un usuario puede marcar en su perfil (PC, PlayStation, Xbox, Nintendo…).</summary>
public class Platform
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class UserPlatform
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int PlatformId { get; set; }
    public Platform Platform { get; set; } = null!;
}
