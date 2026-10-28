using System.ComponentModel.DataAnnotations;

namespace GameScore.Api.Dtos;

// ---------- Auth ----------

public record RegisterRequest(
    [Required, StringLength(20, MinimumLength = 3), RegularExpression("^[a-zA-Z0-9_.-]+$",
        ErrorMessage = "El nombre de usuario solo puede tener letras, números, '_', '.' y '-'.")]
    string UserName,
    [Required, EmailAddress] string Email,
    [Required, StringLength(100, MinimumLength = 8)] string Password,
    [StringLength(50)] string? DisplayName);

public record LoginRequest(
    [Required] string UserNameOrEmail,
    [Required] string Password);

public record AuthResponse(string Token, DateTime ExpiresAt, CurrentUserDto User);

public record CurrentUserDto(string Id, string UserName, string DisplayName, string Email, string? AvatarUrl);

// ---------- Juegos ----------

public record GenreDto(int Id, string Name, string Slug);

public record GameSummaryDto(
    int RawgId,
    string Slug,
    string Name,
    string? BackgroundImage,
    DateOnly? Released,
    IReadOnlyList<string> Genres,
    double? AverageScore,
    int RatingsCount);

public record ReviewDto(
    string UserName,
    string DisplayName,
    string? AvatarUrl,
    decimal Score,
    string? Review,
    DateTime UpdatedAt);

public record MyRatingDto(decimal Score, string? Review, DateTime UpdatedAt);

public record GameDetailDto(
    int RawgId,
    string Slug,
    string Name,
    string? BackgroundImage,
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
    int RawgId,
    string Slug,
    string Name,
    string? BackgroundImage,
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
    string DisplayName,
    string? AvatarUrl,
    int RawgId,
    string GameName,
    string? GameImage,
    decimal Score,
    string? Review,
    DateTime UpdatedAt);

// ---------- Perfiles ----------

public record TopGameDto(int Position, int RawgId, string Slug, string Name, string? BackgroundImage);

public record ProfileRatingDto(int RawgId, string GameName, string? GameImage, decimal Score, string? Review, DateTime UpdatedAt);

public record ProfileDto(
    string UserName,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    DateTime CreatedAt,
    int RatingsCount,
    double? AverageGiven,
    IReadOnlyList<TopGameDto> TopGames,
    IReadOnlyList<GenreDto> FavoriteGenres,
    IReadOnlyList<ProfileRatingDto> RecentRatings);

public record UpdateProfileRequest(
    [Required, StringLength(50, MinimumLength = 1)] string DisplayName,
    [StringLength(300)] string? Bio,
    [StringLength(500), Url] string? AvatarUrl);

public record UpdateTopGamesRequest([MaxLength(5)] List<int> RawgIds);

public record UpdateFavoriteGenresRequest([MaxLength(5)] List<int> GenreIds);
