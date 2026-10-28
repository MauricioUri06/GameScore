using Npgsql;

namespace GameScore.Api.Data;

/// <summary>
/// Resuelve la cadena de conexión a PostgreSQL (Neon).
///
/// Orden de prioridad:
///   1. ConnectionStrings:Default (User Secrets / appsettings) — si la defines, gana.
///   2. Variables DATABASE_URL / DATABASE_URL_UNPOOLED (entorno o configuración; así funciona en producción).
///   3. Archivo .env.local (o .env) en la raíz del repo, que genera `neon env pull` / `neon deploy`.
///
/// Neon da dos URLs: la "pooled" (host con -pooler, pasa por PgBouncer) para el tráfico normal
/// de la app, y la directa ("unpooled") para migraciones, que necesitan una sesión real.
/// </summary>
public static class NeonConnection
{
    public const string PooledKey = "DATABASE_URL";
    public const string UnpooledKey = "DATABASE_URL_UNPOOLED";

    /// <summary>Cadena para el tráfico normal de la API (pooled).</summary>
    public static string? ForApp(IConfiguration config, string startDirectory) =>
        Resolve(config, startDirectory, PooledKey, UnpooledKey);

    /// <summary>Cadena para migraciones de EF Core (directa, sin pooler).</summary>
    public static string? ForMigrations(IConfiguration config, string startDirectory) =>
        Resolve(config, startDirectory, UnpooledKey, PooledKey);

    private static string? Resolve(IConfiguration config, string startDirectory, string preferredKey, string fallbackKey)
    {
        var explicitConnection = config.GetConnectionString("Default");
        if (!string.IsNullOrWhiteSpace(explicitConnection)) return explicitConnection;

        var fromConfig = config[preferredKey] ?? config[fallbackKey];
        if (!string.IsNullOrWhiteSpace(fromConfig)) return ToNpgsql(fromConfig);

        var dotEnv = ReadDotEnv(startDirectory);
        var fromFile = dotEnv.GetValueOrDefault(preferredKey) ?? dotEnv.GetValueOrDefault(fallbackKey);
        return string.IsNullOrWhiteSpace(fromFile) ? null : ToNpgsql(fromFile);
    }

    /// <summary>
    /// Convierte una URL postgresql://usuario:clave@host/db?sslmode=require
    /// al formato clave=valor que entiende Npgsql. Si ya viene en ese formato, la deja igual.
    /// </summary>
    public static string ToNpgsql(string value)
    {
        value = value.Trim();
        if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return value;

        var uri = new Uri(value);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
            SslMode = SslMode.Require
        };

        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]).ToLowerInvariant();
            var val = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;

            switch (key)
            {
                case "sslmode" when Enum.TryParse<SslMode>(val.Replace("-", ""), true, out var ssl):
                    builder.SslMode = ssl;
                    break;
                case "channel_binding" when Enum.TryParse<ChannelBinding>(val, true, out var binding):
                    builder.ChannelBinding = binding;
                    break;
            }
        }

        return builder.ConnectionString;
    }

    /// <summary>Busca .env.local y luego .env subiendo desde startDirectory hasta la raíz del disco.</summary>
    private static Dictionary<string, string> ReadDotEnv(string startDirectory)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        for (var dir = new DirectoryInfo(startDirectory); dir is not null; dir = dir.Parent)
        {
            foreach (var name in new[] { ".env.local", ".env" })
            {
                var path = Path.Combine(dir.FullName, name);
                if (!File.Exists(path)) continue;

                foreach (var rawLine in File.ReadAllLines(path))
                {
                    var line = rawLine.Trim();
                    if (line.Length == 0 || line.StartsWith('#')) continue;
                    if (line.StartsWith("export ")) line = line[7..].TrimStart();

                    var eq = line.IndexOf('=');
                    if (eq <= 0) continue;

                    var key = line[..eq].Trim();
                    var val = line[(eq + 1)..].Trim().Trim('"', '\'');
                    values.TryAdd(key, val); // .env.local tiene prioridad sobre .env
                }
            }

            if (values.Count > 0) return values;
        }

        return values;
    }
}
