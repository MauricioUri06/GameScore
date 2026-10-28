namespace GameScore.Api.Options;

public class JwtOptions
{
    public const string Section = "Jwt";

    /// <summary>Clave secreta para firmar tokens. Mínimo 32 caracteres.</summary>
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "GameScore";
    public string Audience { get; set; } = "GameScore.Client";
    public int ExpiresHours { get; set; } = 168; // 7 días
}
