using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Catalog.Igdb;

/// <summary>
/// Obtiene y guarda en memoria el token de acceso de Twitch (OAuth "client credentials")
/// que exige IGDB. El token dura ~60 días; se renueva solo cuando está por vencer
/// o cuando IGDB responde 401.
/// </summary>
public class IgdbTokenProvider(IHttpClientFactory httpFactory, IOptions<IgdbOptions> options)
{
    public const string HttpClientName = "twitch-auth";

    private readonly IgdbOptions _options = options.Value;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private string? _token;
    private DateTime _expiresAt = DateTime.MinValue;

    public async Task<string> GetTokenAsync(CancellationToken ct)
    {
        if (_token is not null && DateTime.UtcNow < _expiresAt) return _token;

        await _lock.WaitAsync(ct);
        try
        {
            if (_token is not null && DateTime.UtcNow < _expiresAt) return _token;

            if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.ClientSecret))
                throw new CatalogException(
                    "Faltan las credenciales de IGDB (Igdb:ClientId e Igdb:ClientSecret en User Secrets).");

            var http = httpFactory.CreateClient(HttpClientName);
            var url = $"{_options.TokenUrl}?client_id={Uri.EscapeDataString(_options.ClientId)}" +
                      $"&client_secret={Uri.EscapeDataString(_options.ClientSecret)}&grant_type=client_credentials";

            using var response = await http.PostAsync(url, content: null, ct);
            if (!response.IsSuccessStatusCode)
                throw new CatalogException(
                    $"Twitch rechazó las credenciales de IGDB ({(int)response.StatusCode}). Revisa el Client ID y el Secret.",
                    (int)response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<TokenResponse>(ct)
                       ?? throw new CatalogException("Twitch devolvió un token vacío.");

            _token = body.AccessToken;
            // Renovamos 5 minutos antes de que venza
            _expiresAt = DateTime.UtcNow.AddSeconds(Math.Max(60, body.ExpiresIn - 300));
            return _token;
        }
        finally
        {
            _lock.Release();
        }
    }

    public void Invalidate()
    {
        _token = null;
        _expiresAt = DateTime.MinValue;
    }

    private record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn);
}
