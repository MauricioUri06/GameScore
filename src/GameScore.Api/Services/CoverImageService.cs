using System.Collections.Concurrent;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace GameScore.Api.Services;

/// <summary>
/// Descarga portadas y genera versiones borrosas en el servidor, para que el navegador nunca reciba
/// la imagen nítida mientras se está adivinando.
/// </summary>
public class CoverImageService(IHttpClientFactory httpFactory, ILogger<CoverImageService> logger)
{
    public const string HttpClientName = "covers";

    /// <summary>Desenfoque según los intentos fallidos (0 = el más borroso). null = nítida.</summary>
    private static readonly float[] BlurByAttempt = [14f, 9f, 5.5f, 3f];

    private const int MaxCached = 200;
    private readonly ConcurrentDictionary<string, byte[]> _originals = new();

    public async Task<byte[]> GetAsync(string coverUrl, int? attempts, CancellationToken ct)
    {
        var original = await GetOriginalAsync(coverUrl, ct);
        using var image = Image.Load(original);

        // Se reduce a 160 px de ancho: aunque alguien "quite" el desenfoque, no hay detalle que recuperar
        image.Mutate(x => x.Resize(new ResizeOptions { Size = new Size(160, 0), Mode = ResizeMode.Max }));
        if (attempts is { } a)
            image.Mutate(x => x.GaussianBlur(BlurByAttempt[Math.Clamp(a, 0, BlurByAttempt.Length - 1)]));

        using var output = new MemoryStream();
        await image.SaveAsync(output, new JpegEncoder { Quality = 80 }, ct);
        return output.ToArray();
    }

    private async Task<byte[]> GetOriginalAsync(string url, CancellationToken ct)
    {
        if (_originals.TryGetValue(url, out var cached)) return cached;

        var http = httpFactory.CreateClient(HttpClientName);
        var bytes = await http.GetByteArrayAsync(url, ct);
        if (_originals.Count >= MaxCached)
        {
            logger.LogDebug("Caché de portadas llena; se vacía.");
            _originals.Clear();
        }

        _originals[url] = bytes;
        return bytes;
    }
}
