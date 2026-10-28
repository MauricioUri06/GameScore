namespace GameScore.Api.Catalog.Igdb;

public class IgdbOptions
{
    public const string Section = "Igdb";

    /// <summary>Client ID de tu app en dev.twitch.tv. Va en User Secrets.</summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>Client Secret de tu app en dev.twitch.tv. Va en User Secrets, nunca en el repo.</summary>
    public string ClientSecret { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.igdb.com/v4/";
    public string TokenUrl { get; set; } = "https://id.twitch.tv/oauth2/token";
}
