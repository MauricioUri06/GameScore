namespace GameScore.Api.Entities;

/// <summary>Medalla que el usuario eligió mostrar en su perfil (máximo 10, en orden).</summary>
public class UserShowcaseMedal
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    /// <summary>Id de la medalla en MedalService (ej. "review-10").</summary>
    public string MedalId { get; set; } = string.Empty;

    public int Position { get; set; }
}
