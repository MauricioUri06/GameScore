using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using GameScore.Api.Data;
using GameScore.Api.Entities;
using GameScore.Api.Infrastructure;
using GameScore.Api.Options;
using GameScore.Api.Catalog;
using GameScore.Api.Catalog.Igdb;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// Hostings como Vercel o Render indican el puerto en la variable PORT
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ---------- Opciones (appsettings + User Secrets) ----------
builder.Services.Configure<JwtOptions>(config.GetSection(JwtOptions.Section));
builder.Services.Configure<CatalogOptions>(config.GetSection(CatalogOptions.Section));
builder.Services.Configure<IgdbOptions>(config.GetSection(IgdbOptions.Section));
builder.Services.Configure<RankingOptions>(config.GetSection(RankingOptions.Section));

// ---------- Base de datos (PostgreSQL en Neon) ----------
// La app usa la URL "pooled" de Neon; las migraciones, la directa (ver Data/NeonConnection.cs).
var connectionString = NeonConnection.ForApp(config, builder.Environment.ContentRootPath)
    ?? throw new InvalidOperationException(
        "No se encontró la conexión a la base de datos. En tu PC ejecuta `neon env pull` en la raíz del repo; " +
        "en el hosting define las variables DATABASE_URL y DATABASE_URL_UNPOOLED (ver README).");

builder.Services.AddDbContext<GameScoreDbContext>(options => options.UseNpgsql(connectionString));

// ---------- Identity (usuarios y contraseñas) ----------
builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        // Cuentas con nickname + clave de 6 dígitos (sin correo)
        options.User.RequireUniqueEmail = false;
        options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-";
        options.Password.RequiredLength = 6;
        options.Password.RequiredUniqueChars = 1;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        // Una clave de 6 dígitos es corta: bloqueamos la cuenta tras varios intentos fallidos
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<GameScoreDbContext>();

// ---------- Autenticación JWT ----------
var jwt = config.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
if (jwt.Key.Length < 32)
    throw new InvalidOperationException(
        "Falta la clave para firmar las sesiones: define la variable Jwt__Key con al menos 32 caracteres (ver README).");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            NameClaimType = ClaimTypes.Name
        };
    });
// Administradores: nicknames listados en Admin:UserNames (appsettings.json)
var adminAccess = new AdminAccess(config.GetSection(AdminAccess.Section).Get<string[]>() ?? []);
builder.Services.AddSingleton(adminAccess);
builder.Services.AddAuthorization(options =>
    options.AddPolicy(AdminAccess.Policy, policy => policy
        .RequireAuthenticatedUser()
        .RequireAssertion(ctx => adminAccess.IsAdmin(ctx.User.Identity?.Name))));

// ---------- Servicios de la app ----------
// Catálogo de juegos: IGDB (Twitch). Para cambiar de proveedor basta con otra implementación de IGameCatalog.
builder.Services.AddHttpClient(IgdbTokenProvider.HttpClientName, http => http.Timeout = TimeSpan.FromSeconds(15));
builder.Services.AddSingleton<IgdbTokenProvider>();
builder.Services.AddHttpClient<IGameCatalog, IgdbCatalog>((sp, http) =>
{
    var igdb = sp.GetRequiredService<IOptions<IgdbOptions>>().Value;
    http.BaseAddress = new Uri(igdb.BaseUrl);
    http.Timeout = TimeSpan.FromSeconds(15);
    http.DefaultRequestHeaders.UserAgent.ParseAdd("GameScore/1.0");
});
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<RankingService>();
builder.Services.AddScoped<MedalService>();
builder.Services.AddSingleton<TokenService>();

// Límite de intentos en registro/login (además del bloqueo de cuenta de Identity)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = (ctx, ct) => new ValueTask(ctx.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = StatusCodes.Status429TooManyRequests,
        Title = "Demasiados intentos. Espera un minuto y vuelve a intentarlo."
    }, ct));
    options.AddPolicy(RateLimits.Auth, http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "desconocido",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

builder.Services.AddExceptionHandler<CatalogExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ---------- CORS (frontend React) ----------
var allowedOrigins = config.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// Aplica las migraciones pendientes al arrancar (en tu PC y en el hosting), por la conexión directa.
// Se puede desactivar con Database__MigrateOnStartup=false.
if (config.GetValue("Database:MigrateOnStartup", true))
{
    var migrationConnection = NeonConnection.ForMigrations(config, app.Environment.ContentRootPath)!;
    var migrationOptions = new DbContextOptionsBuilder<GameScoreDbContext>().UseNpgsql(migrationConnection).Options;
    using var migrationDb = new GameScoreDbContext(migrationOptions);
    migrationDb.Database.Migrate();
}

app.UseExceptionHandler();

// En producción la API también sirve la página React (compilada en wwwroot por el Dockerfile)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" })).ExcludeFromDescription();

if (app.Environment.IsDevelopment())
{
    // Documentación interactiva en /scalar (solo en tu PC)
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.MapGet("/", () => Results.Redirect("/scalar")).ExcludeFromDescription();
}
else
{
    // Rutas de la página (/juegos, /u/nickname…) devuelven index.html; las de /api inexistentes, 404
    app.MapFallback("/api/{**rest}", () => Results.NotFound());
    app.MapFallbackToFile("index.html");
}

app.Run();
