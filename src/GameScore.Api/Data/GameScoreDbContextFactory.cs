using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GameScore.Api.Data;

/// <summary>
/// Usada solo por las herramientas de EF Core (dotnet ef migrations / database update).
/// Conecta con la URL directa de Neon (sin pooler), que es la recomendada para migraciones.
/// </summary>
public class GameScoreDbContextFactory : IDesignTimeDbContextFactory<GameScoreDbContext>
{
    public GameScoreDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets(typeof(GameScoreDbContextFactory).Assembly, optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = NeonConnection.ForMigrations(config, Directory.GetCurrentDirectory())
            ?? throw new InvalidOperationException(
                "No se encontró la conexión a la base de datos. Ejecuta `neon env pull` en la raíz del repo " +
                "o define ConnectionStrings:Default en User Secrets.");

        var options = new DbContextOptionsBuilder<GameScoreDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new GameScoreDbContext(options);
    }
}
