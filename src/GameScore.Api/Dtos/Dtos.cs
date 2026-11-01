using System.ComponentModel.DataAnnotations;

namespace GameScore.Api.Dtos;

// Nota: "GameId" en los DTOs es el id del juego en el catálogo externo (IGDB),
// el mismo que aparece en las rutas /api/games/{gameId}.

// ---------- Auth ----------

public record RegisterRequest(
    [Required, StringLength(20, MinimumLength = 3), RegularExpression("^[a-zA-Z0-9_.-]+$",
        ErrorMessage = "El nickname solo puede tener letras, números, '_', '.' y '-'.")]
    string UserName,
    [Required, RegularExpression("^[0-9]{6}$", ErrorMessage = "La clave debe tener exactamente 6 dígitos.")]
    string Pin);

public record LoginRequest(
    [Required] string UserName,
    [Required] string Pin);

public record AuthResponse(string Token, DateTime ExpiresAt, CurrentUserDto User);

public record CurrentUserDto(string Id, string UserName, string? AvatarUrl);

// ---------- Juegos ----------

public record GenreDto(int Id, string Name, string Slug);

public record GameSummaryDto(
    int GameId,
    string Slug,
    string Name,
    string? CoverUrl,
    DateOnly? Released,
    IReadOnlyList<string> Genres,
    double? AverageScore,
    int RatingsCount);

public record ReviewDto(
    string UserName,
    string? AvatarUrl,
    decimal Score,
    string? Review,
    DateTime UpdatedAt);

public record MyRatingDto(decimal Score, string? Review, DateTime UpdatedAt);

public record GameDetailDto(
    int GameId,
    string Slug,
    string Name,
    string? CoverUrl,
    string? BackgroundUrl,
    DateOnly? Released,
    string? Description,
    IReadOnlyList<GenreDto> Genres,
    double? AverageScore,
    int RatingsCount,
    // Cantidad de calificaciones por valor: índice 0 = 0.5 estrellas ... índice 9 = 5 estrellas
    IReadOnlyList<int> Distribution,
    MyRatingDto? MyRating,
    IReadOnlyList<ReviewDto> RecentReviews);

public record RankedGameDto(
    int Position,
    int GameId,
    string Slug,
    string Name,
    string? CoverUrl,
    DateOnly? Released,
    double AverageScore,
    double WeightedScore,
    int RatingsCount);

// ---------- Calificaciones ----------

public record RateGameRequest(
    [Range(0.5, 5.0)] decimal Score,
    [StringLength(2000)] string? Review);

public record ActivityDto(
    string UserName,
    string? AvatarUrl,
    int GameId,
    string GameName,
    string? GameCover,
    decimal Score,
    string? Review,
    DateTime UpdatedAt);

// ---------- Perfiles ----------

public record TopGameDto(int Position, int GameId, string Slug, string Name, string? CoverUrl);

public record ProfileRatingDto(int GameId, string GameName, string? GameCover, decimal Score, string? Review, DateTime UpdatedAt);

public record PlatformDto(int Id, string Name);

public record ProfileDto(
    string UserName,
    string? AvatarUrl,
    DateTime CreatedAt,
    int RatingsCount,
    double? AverageGiven,
    IReadOnlyList<TopGameDto> TopGames,
    IReadOnlyList<GenreDto> FavoriteGenres,
    IReadOnlyList<PlatformDto> Platforms,
    IReadOnlyList<ProfileRatingDto> RecentRatings);

public record UpdatePlatformsRequest(List<int> PlatformIds);

public record UpdateTopGamesRequest([MaxLength(5)] List<int> GameIds);

public record UpdateFavoriteGenresRequest([MaxLength(5)] List<int> GenreIds);
