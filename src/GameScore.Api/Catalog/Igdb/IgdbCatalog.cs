using System.Net;
using System.Text;
using System.Text.Json;
using GameScore.Api.Entities;
using Microsoft.Extensions.Options;

namespace GameScore.Api.Catalog.Igdb;

/// <summary>
/// Implementación de <see cref="IGameCatalog"/> con la API de IGDB (https://api-docs.igdb.com).
/// IGDB usa POST con un lenguaje de consultas propio ("Apicalypse") en el cuerpo.
/// </summary>
public class IgdbCatalog(HttpClient http, IgdbTokenProvider tokens, IOptions<IgdbOptions> options) : IGameCatalog
{
    private const string GameFields =
        "fields name,slug,summary,first_release_date,total_rating_count,cover.image_id,artworks.image_id," +
        "screenshots.image_id,genres.name,genres.slug,themes.name,themes.slug,platforms;";

    /// <summary>
    /// Tipos de juego que mostramos: juego principal (0), expansión independiente (4), remake (8),
    /// remaster (9) y edición ampliada (10). Así quedan fuera DLCs, actualizaciones, mods, packs, etc.
    /// </summary>
    private const string AllowedTypes = "(0,4,8,9,10)";

    // IGDB reemplazó el campo "category" por "game_type". Si la API no reconoce game_type,
    // volvemos a "category" (mismos valores) automáticamente.
    private static string _typeField = "game_type";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    /// <summary>Máximo de resultados que IGDB devuelve en una sola consulta.</summary>
    public const int MaxResults = 500;

    private readonly IgdbOptions _options = options.Value;

    public async Task<List<CatalogGame>> SearchAsync(string query, CatalogGenreFilter? genre, CancellationToken ct, int max = MaxResults)
    {
        var text = query.Replace("\\", "").Replace("\"", "\\\"").Trim();

        // IGDB no permite ordenar una búsqueda, así que pedimos todos los resultados que deja
        // en una consulta (máx. 500) y los ordenamos nosotros: nombre exacto primero, luego los más populares.
        var games = await WithTypeFallback(type => QueryAsync<IgdbGame>("games",
            $"search \"{text}\"; {GameFields} where {BaseFilter(type, genre)}; limit {Math.Clamp(max, 1, MaxResults)};", ct));

        return games
            .Where(IsAllowed)
            .OrderBy(g => string.Equals(g.Name, text, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenByDescending(g => g.TotalRatingCount ?? 0)
            .Select(ToCatalog)
            .ToList();
    }

    /// <summary>Mínimo de calificaciones en IGDB para aparecer en el listado alfabético.</summary>
    private const int BrowseMinRatings = 5;

    public async Task<CatalogPage> BrowseAsync(int page, int pageSize, CatalogGenreFilter? genre, CancellationToken ct)
    {
        // Orden alfabético. Se dejan fuera los juegos con menos de 5 calificaciones en IGDB:
        // si no, las primeras páginas se llenan de juegos desconocidos que empiezan con símbolos y números.
        string Where(string type) => $"{BaseFilter(type, genre)} & total_rating_count >= {BrowseMinRatings}";

        // Dos consultas seguidas (no en paralelo) para respetar el límite de 4 por segundo de IGDB
        var total = await WithTypeFallback(type =>
            PostAsync<IgdbCount>("games/count", $"where {Where(type)};", ct));

        var games = await WithTypeFallback(type => QueryAsync<IgdbGame>("games",
            $"{GameFields} where {Where(type)}; sort name asc; " +
            $"limit {pageSize}; offset {(page - 1) * pageSize};", ct));

        return new CatalogPage(games.Where(IsAllowed).Select(ToCatalog).ToList(), total.Count);
    }

    public async Task<List<CatalogGame>> GetPopularAsync(int count, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var from = now.AddYears(-2).ToUnixTimeSeconds();
        var to = now.ToUnixTimeSeconds();

        var games = await WithTypeFallback(type => QueryAsync<IgdbGame>("games",
            $"{GameFields} where {BaseFilter(type, null)} & first_release_date >= {from} & first_release_date <= {to} " +
            $"& total_rating_count >= 5; sort total_rating_count desc; limit {count};", ct));

        return games.Where(IsAllowed).Select(ToCatalog).ToList();
    }

    /// <summary>
    /// Filtro común: juegos "de verdad" (sin DLC, updates, mods, versiones), con portada,
    /// sin contenido adulto y, si se pide, de un género o temática.
    /// </summary>
    private static string BaseFilter(string typeField, CatalogGenreFilter? genre)
    {
        var filter = $"version_parent = null & cover != null & {typeField} = {AllowedTypes} " +
                     $"& themes != ({IgdbGenreNames.EroticThemeId})";

        return genre switch
        {
            { Kind: GenreKind.Genre, Id: var id } => filter + $" & genres = ({id})",
            { Kind: GenreKind.Theme, Id: var id } => filter + $" & themes = ({id})",
            _ => filter
        };
    }

    public async Task<CatalogGame?> GetGameAsync(int id, CancellationToken ct)
    {
        var games = await QueryAsync<IgdbGame>("games", $"{GameFields} where id = {id};", ct);
        return games.Count == 0 ? null : ToCatalog(games[0]);
    }

    /// <summary>Todos los géneros y temáticas de IGDB (salvo las ocultas), con nombre en español.</summary>
    public async Task<List<CatalogGenre>> GetGenresAsync(CancellationToken ct)
    {
        var genres = await QueryAsync<IgdbGenre>("genres", "fields name,slug; limit 500;", ct);
        var themes = await QueryAsync<IgdbGenre>("themes", "fields name,slug; limit 500;", ct);

        return genres.Select(g => ToGenre(g, GenreKind.Genre))
            .Concat(themes
                .Where(t => !IgdbGenreNames.HiddenThemes.Contains(t.Slug ?? ""))
                .Select(t => ToGenre(t, GenreKind.Theme)))
            .ToList();
    }

    /// <summary>
    /// IGDB reemplazó "category" por "game_type". Si la API rechaza game_type, volvemos a "category".
    /// </summary>
    private static async Task<T> WithTypeFallback<T>(Func<string, Task<T>> query)
    {
        try
        {
            return await query(_typeField);
        }
        catch (CatalogException ex) when (ex.StatusCode == 400 && _typeField == "game_type"
                                          && ex.Details?.Contains("game_type", StringComparison.OrdinalIgnoreCase) == true)
        {
            _typeField = "category";
            return await query(_typeField);
        }
    }

    private Task<List<T>> QueryAsync<T>(string endpoint, string body, CancellationToken ct) =>
        PostAsync<List<T>>(endpoint, body, ct);

    private async Task<T> PostAsync<T>(string endpoint, string body, CancellationToken ct, bool retried = false)
        where T : new()
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
            return await PostAsync<T>(endpoint, body, ct, retried: true);
        }

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
            throw new CatalogException("IGDB está limitando las consultas (máx. 4 por segundo). Intenta de nuevo.", 429);

        if (!response.IsSuccessStatusCode)
        {
            var details = await response.Content.ReadAsStringAsync(ct);
            throw new CatalogException($"IGDB respondió {(int)response.StatusCode}.", (int)response.StatusCode,
                details.Length > 500 ? details[..500] : details);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        return await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, ct) ?? new T();
    }

    /// <summary>Segundo filtro, por si IGDB deja pasar algo con temática oculta.</summary>
    private static bool IsAllowed(IgdbGame g) =>
        g.Themes is null || !g.Themes.Any(t => IgdbGenreNames.HiddenThemes.Contains(t.Slug ?? ""));

    private static CatalogGenre ToGenre(IgdbGenre g, GenreKind kind) =>
        new(g.Id, IgdbGenreNames.Translate(g.Slug, g.Name), g.Slug ?? $"{kind}-{g.Id}".ToLowerInvariant(), kind);

    private static CatalogGame ToCatalog(IgdbGame g)
    {
        var backgroundId = g.Artworks?.FirstOrDefault()?.ImageId ?? g.Screenshots?.FirstOrDefault()?.ImageId;

        var genres = (g.Genres ?? []).Select(x => ToGenre(x, GenreKind.Genre))
            .Concat((g.Themes ?? [])
                .Where(t => !IgdbGenreNames.HiddenThemes.Contains(t.Slug ?? ""))
                .Select(t => ToGenre(t, GenreKind.Theme)))
            .ToList();

        return new CatalogGame(
            g.Id,
            g.Slug ?? g.Id.ToString(),
            g.Name ?? "(sin nombre)",
            ImageUrl(g.Cover?.ImageId, "t_cover_big"),
            ImageUrl(backgroundId, "t_1080p") ?? ImageUrl(g.Cover?.ImageId, "t_cover_big"),
            g.FirstReleaseDate is { } unix ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(unix).UtcDateTime) : null,
            g.Summary,
            genres,
            g.Platforms ?? []);
    }

    /// <summary>
    /// URL de imagen de IGDB. Tamaños útiles: t_thumb (90x90), t_cover_small (90x128),
    /// t_cover_big (264x374), t_720p, t_1080p.
    /// </summary>
    private static string? ImageUrl(string? imageId, string size) =>
        string.IsNullOrEmpty(imageId) ? null : $"https://images.igdb.com/igdb/image/upload/{size}/{imageId}.jpg";

    // ---------- Modelos de la respuesta JSON de IGDB ----------

    private class IgdbCount
    {
        public int Count { get; set; }
    }

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
        public int? TotalRatingCount { get; set; }
        public IgdbImage? Cover { get; set; }
        public List<IgdbImage>? Artworks { get; set; }
        public List<IgdbImage>? Screenshots { get; set; }
        public List<IgdbGenre>? Genres { get; set; }
        public List<IgdbGenre>? Themes { get; set; }
        public List<int>? Platforms { get; set; }
    }
}
