using System.Net;
using System.Text.Json;
using GameScore.Api.Options;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Rawg;

public class RawgException(string message, HttpStatusCode? statusCode = null) : Exception(message)
{
    public HttpStatusCode? StatusCode { get; } = statusCode;
}

/// <summary>
/// Cliente tipado para la API de RAWG (https://rawg.io/apidocs).
/// </summary>
public class RawgClient(HttpClient http, IOptions<RawgOptions> options)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    private readonly RawgOptions _options = options.Value;

    public Task<RawgPage<RawgGameListItem>> SearchGamesAsync(string query, int page, int pageSize, CancellationToken ct) =>
        GetAsync<RawgPage<RawgGameListItem>>(
            $"games?search={Uri.EscapeDataString(query)}&search_precise=true&page={page}&page_size={pageSize}", ct);

    /// <summary>Juegos populares de los últimos años, para la portada.</summary>
    public Task<RawgPage<RawgGameListItem>> GetPopularGamesAsync(int pageSize, CancellationToken ct)
    {
        var to = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var from = DateTime.UtcNow.AddYears(-2).ToString("yyyy-MM-dd");
        return GetAsync<RawgPage<RawgGameListItem>>(
            $"games?dates={from},{to}&ordering=-added&page_size={pageSize}", ct);
    }

    public async Task<RawgGameDetail?> GetGameAsync(int rawgId, CancellationToken ct)
    {
        try
        {
            return await GetAsync<RawgGameDetail>($"games/{rawgId}", ct);
        }
        catch (RawgException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public Task<RawgPage<RawgGenre>> GetGenresAsync(CancellationToken ct) =>
        GetAsync<RawgPage<RawgGenre>>("genres?page_size=40", ct);

    private async Task<T> GetAsync<T>(string pathAndQuery, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new RawgException("Falta configurar la API key de RAWG (Rawg:ApiKey en User Secrets).");

        var separator = pathAndQuery.Contains('?') ? '&' : '?';
        var url = $"{pathAndQuery}{separator}key={_options.ApiKey}";

        using var response = await http.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode)
            throw new RawgException($"RAWG respondió {(int)response.StatusCode}.", response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var result = await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, ct);
        return result ?? throw new RawgException("RAWG devolvió una respuesta vacía.");
    }
}
