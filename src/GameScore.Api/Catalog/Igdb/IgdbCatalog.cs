using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Catalog.Igdb;

/// <summary>
/// Implementación de <see cref="IGameCatalog"/> con la API de IGDB (https://api-docs.igdb.com).
/// IGDB usa POST con un lenguaje de consultas propio ("Apicalypse") en el cuerpo.
/// </summary>
public class IgdbCatalog(HttpClient http, IgdbTokenProvider tokens, IOptions<IgdbOptions> options) : IGameCatalog
{
    private const string GameFields =
        "fields name,slug,summary,first_release_date,cover.image_id,artworks.image_id,screenshots.image_id,genres.name,genres.slug;";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    private readonly IgdbOptions _options = options.Value;

    public async Task<List<CatalogGame>> SearchAsync(string query, int page, int pageSize, CancellationToken ct)
    {
        var text = query.Replace("\\", "").Replace("\"", "\\\"");
        var body = $"search \"{text}\"; {GameFields} where version_parent = null; " +
                   $"limit {pageSize}; offset {(page - 1) * pageSize};";
        return (await QueryAsync<IgdbGame>("games", body, ct)).Select(ToCatalog).ToList();
    }

    public async Task<List<CatalogGame>> GetPopularAsync(int count, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var from = now.AddYears(-2).ToUnixTimeSeconds();
        var to = now.ToUnixTimeSeconds();
        var body = $"{GameFields} where first_release_date >= {from} & first_release_date <= {to} " +
                   $"& cover != null & total_rating_count >= 5; sort total_rating_count desc; limit {count};";
        return (await QueryAsync<IgdbGame>("games", body, ct)).Select(ToCatalog).ToList();
    }

    public async Task<CatalogGame?> GetGameAsync(int id, CancellationToken ct)
    {
        var games = await QueryAsync<IgdbGame>("games", $"{GameFields} where id = {id};", ct);
        return games.Count == 0 ? null : ToCatalog(games[0]);
    }

    public async Task<List<CatalogGenre>> GetGenresAsync(CancellationToken ct)
    {
        var genres = await QueryAsync<IgdbGenre>("genres", "fields name,slug; sort name asc; limit 100;", ct);
        return genres.Select(g => new CatalogGenre(g.Id, g.Name ?? "?", g.Slug ?? g.Id.ToString())).ToList();
    }

    private async Task<List<T>> QueryAsync<T>(string endpoint, string body, CancellationToken ct, bool retried = false)
    {
        var token = await tokens.GetTokenAsync(ct);

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(body, Encoding.UTF8, "text/plain")
        };
        request.Headers.Add("Client-ID", _options.ClientId);
        request.Headers.Authorization = new("Bearer", token);

        using var response = await http.SendAsync(request, ct);

        if (response.StatusCode == HttpStatusCode.Unauthorized && !retried)
        {
            // Token vencido o revocado: pedimos otro y reintentamos una vez
            tokens.Invalidate();
            return await QueryAsync<T>(endpoint, body, ct, retried: true);
        }

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
            throw new CatalogException("IGDB está limitando las consultas (máx. 4 por segundo). Intenta de nuevo.", 429);

        if (!response.IsSuccessStatusCode)
            throw new CatalogException($"IGDB respondió {(int)response.StatusCode}.", (int)response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        return await JsonSerializer.DeserializeAsync<List<T>>(stream, JsonOptions, ct) ?? [];
    }

    private static CatalogGame ToCatalog(IgdbGame g)
    {
        var backgroundId = g.Artworks?.FirstOrDefault()?.ImageId ?? g.Screenshots?.FirstOrDefault()?.ImageId;

        return new CatalogGame(
            g.Id,
            g.Slug ?? g.Id.ToString(),
            g.Name ?? "(sin nombre)",
            ImageUrl(g.Cover?.ImageId, "t_cover_big"),
            ImageUrl(backgroundId, "t_1080p") ?? ImageUrl(g.Cover?.ImageId, "t_cover_big"),
            g.FirstReleaseDate is { } unix ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(unix).UtcDateTime) : null,
            g.Summary,
            (g.Genres ?? []).Select(x => new CatalogGenre(x.Id, x.Name ?? "?", x.Slug ?? x.Id.ToString())).ToList());
    }

    /// <summary>
    /// URL de imagen de IGDB. Tamaños útiles: t_thumb (90x90), t_cover_small (90x128),
    /// t_cover_big (264x374), t_720p, t_1080p.
    /// </summary>
    private static string? ImageUrl(string? imageId, string size) =>
        string.IsNullOrEmpty(imageId) ? null : $"https://images.igdb.com/igdb/image/upload/{size}/{imageId}.jpg";

    // ---------- Modelos de la respuesta JSON de IGDB ----------

    private class IgdbImage
    {
        public string? ImageId { get; set; }
    }

    private class IgdbGenre
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Slug { get; set; }
    }

    private class IgdbGame
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public string? Summary { get; set; }
        public long? FirstReleaseDate { get; set; }
        public IgdbImage? Cover { get; set; }
        public List<IgdbImage>? Artworks { get; set; }
        public List<IgdbImage>? Screenshots { get; set; }
        public List<IgdbGenre>? Genres { get; set; }
    }
}
