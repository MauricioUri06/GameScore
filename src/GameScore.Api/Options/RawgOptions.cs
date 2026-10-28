namespace GameScore.Api.Options;

public class RawgOptions
{
    public const string Section = "Rawg";

    public string BaseUrl { get; set; } = "https://api.rawg.io/api/";

    /// <summary>API key de rawg.io. Se guarda en User Secrets, nunca en el repo.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Días antes de volver a pedir a RAWG los datos de un juego ya guardado.</summary>
    public int CacheDays { get; set; } = 7;
}
