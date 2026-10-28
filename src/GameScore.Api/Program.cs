using System.Security.Claims;
using System.Text;
using GameScore.Api.Data;
using GameScore.Api.Entities;
using GameScore.Api.Infrastructure;
using GameScore.Api.Options;
using GameScore.Api.Rawg;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ---------- Opciones (appsettings + User Secrets) ----------
builder.Services.Configure<JwtOptions>(config.GetSection(JwtOptions.Section));
builder.Services.Configure<RawgOptions>(config.GetSection(RawgOptions.Section));
builder.Services.Configure<RankingOptions>(config.GetSection(RankingOptions.Section));

// ---------- Base de datos (PostgreSQL en Neon) ----------
// La app usa la URL "pooled" de Neon; las migraciones, la directa (ver Data/NeonConnection.cs).
var connectionString = NeonConnection.ForApp(config, builder.Environment.ContentRootPath)
    ?? throw new InvalidOperationException(
        "No se encontró la conexión a la base de datos. Ejecuta `neon env pull` en la raíz del repo " +
        "o define ConnectionStrings:Default en User Secrets (ver README).");

builder.Services.AddDbContext<GameScoreDbContext>(options => options.UseNpgsql(connectionString));

// ---------- Identity (usuarios y contraseñas) ----------
builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-";
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<GameScoreDbContext>();

// ---------- Autenticación JWT ----------
var jwt = config.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
if (jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key debe tener al menos 32 caracteres.");

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
builder.Services.AddAuthorization();

// ---------- Servicios de la app ----------
builder.Services.AddHttpClient<RawgClient>((sp, http) =>
{
    var rawg = sp.GetRequiredService<IOptions<RawgOptions>>().Value;
    http.BaseAddress = new Uri(rawg.BaseUrl);
    http.Timeout = TimeSpan.FromSeconds(15);
    http.DefaultRequestHeaders.UserAgent.ParseAdd("GameScore/1.0");
});
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<RankingService>();
builder.Services.AddSingleton<TokenService>();

builder.Services.AddExceptionHandler<RawgExceptionHandler>();
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

if (app.Environment.IsDevelopment())
{
    // Documentación interactiva en /scalar
    app.MapOpenApi();
    app.MapScalarApiReference();

    // Aplica migraciones pendientes al iniciar (solo en desarrollo), por la conexión directa
    var migrationConnection = NeonConnection.ForMigrations(config, app.Environment.ContentRootPath)!;
    var migrationOptions = new DbContextOptionsBuilder<GameScoreDbContext>().UseNpgsql(migrationConnection).Options;
    using (var migrationDb = new GameScoreDbContext(migrationOptions))
        migrationDb.Database.Migrate();
}

app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Redirect("/scalar")).ExcludeFromDescription();

app.Run();
