using GameScore.Api.Catalog;

namespace GameScore.Api.Services;

/// <summary>Juego disponible para Older/Newer.</summary>
public record OlderNewerCandidate(int Id, string Name, string? CoverUrl, int Year);

/// <summary>
/// Conjunto de juegos conocidos (los más calificados de IGDB, con portada y fecha) para Older/Newer.
/// Se guarda en memoria y se renueva una vez al día.
/// </summary>
public class OlderNewerPool(IServiceScopeFactory scopes, ILogger<OlderNewerPool> logger)
{
    /// <summary>Cuántos juegos se usan (los N más calificados de IGDB).</summary>
    public const int Size = 1000;

    private static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);
    private readonly SemaphoreSlim _lock = new(1, 1);
    private IReadOnlyList<OlderNewerCandidate> _games = [];
    private Dictionary<int, OlderNewerCandidate> _byId = [];
    private DateTime _loadedAt = DateTime.MinValue;

    public async Task<IReadOnlyList<OlderNewerCandidate>> GetAsync(CancellationToken ct)
    {
        if (_games.Count > 0 && DateTime.UtcNow - _loadedAt < Lifetime) return _games;

        await _lock.WaitAsync(ct);
        try
        {
            if (_games.Count > 0 && DateTime.UtcNow - _loadedAt < Lifetime) return _games;

            using var scope = scopes.CreateScope();
            var catalog = scope.ServiceProvider.GetRequiredService<IGameCatalog>();
            List<CatalogGame> raw;
            try
            {
                raw = await catalog.GetMostRatedAsync(Size, ct);
            }
            catch (CatalogException ex) when (_games.Count > 0)
            {
                // Si IGDB falla pero ya teníamos juegos, seguimos con los de antes
                logger.LogWarning(ex, "No se pudo renovar la lista de Older/Newer; se usa la anterior.");
                _loadedAt = DateTime.UtcNow.AddHours(-23); // reintenta en ~1 h
                return _games;
            }

            _games = raw
                .Where(g => g.Released is not null && g.CoverUrl is not null)
                .GroupBy(g => g.Id)
                .Select(g => g.First())
                .Select(g => new OlderNewerCandidate(g.Id, g.Name, g.CoverUrl, g.Released!.Value.Year))
                .ToList();
            _byId = _games.ToDictionary(g => g.Id);
            _loadedAt = DateTime.UtcNow;
            logger.LogInformation("Older/Newer: {Count} juegos cargados.", _games.Count);
            return _games;
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// Elige un juego al azar que no haya salido en la partida y, si se puede, de un año distinto
    /// al de referencia (así la respuesta nunca es ambigua).
    /// </summary>
    public async Task<OlderNewerCandidate?> PickAsync(IReadOnlyCollection<int> used, int? differentFromYear, CancellationToken ct)
    {
        var games = await GetAsync(ct);
        var usedSet = used as ISet<int> ?? used.ToHashSet();

        for (var attempt = 0; attempt < 60; attempt++)
        {
            var g = games[Random.Shared.Next(games.Count)];
            if (!usedSet.Contains(g.Id) && g.Year != differentFromYear) return g;
        }

        var options = games.Where(g => !usedSet.Contains(g.Id)).ToList();
        if (options.Count == 0) return null;
        var preferred = options.Where(g => g.Year != differentFromYear).ToList();
        var list = preferred.Count > 0 ? preferred : options;
        return list[Random.Shared.Next(list.Count)];
    }
}
