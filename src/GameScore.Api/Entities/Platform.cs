namespace GameScore.Api.Entities;

/// <summary>Consola o plataforma concreta (PS5, Switch, PC…), agrupada por familia.</summary>
public class Platform
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>Grupo para mostrarlas juntas: PC, PlayStation, Xbox, Nintendo u Otras.</summary>
    public string Family { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    /// <summary>
    /// Ids de plataforma en IGDB que corresponden a esta consola. Sirven para saber
    /// en qué consolas está disponible cada juego.
    /// </summary>
    public int[] IgdbIds { get; set; } = [];
}

public class UserPlatform
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int PlatformId { get; set; }
    public Platform Platform { get; set; } = null!;
}
