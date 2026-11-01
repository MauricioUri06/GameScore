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

public record CurrentUserDto(string Id, string UserName, string? AvatarUrl, bool IsAdmin);

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
    int RatingId,
    string UserName,
    string? AvatarUrl,
    decimal Score,
    string? Review,
    string? PlatformName,
    DateTime UpdatedAt,
    int Likes,
    int Dislikes,
    // Voto del usuario actual: 1, -1 o 0 (sin voto / anónimo)
    short MyVote);

public record MyRatingDto(decimal Score, string? Review, int? PlatformId, DateTime UpdatedAt);

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
    // Cantidad de calificaciones por valor: índice 0 = 0 estrellas, 1 = 0.5 ... índice 10 = 5 estrellas
    IReadOnlyList<int> Distribution,
    MyRatingDto? MyRating,
    IReadOnlyList<ReviewDto> RecentReviews,
    // Consolas donde está disponible el juego (vacío si IGDB no lo sabe: se muestran todas)
    IReadOnlyList<PlatformDto> AvailablePlatforms,
    // Calificaciones que además tienen texto
    int ReviewsCount);

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
    [Range(0.0, 5.0)] decimal Score,
    [StringLength(2000)] string? Review,
    [Required(ErrorMessage = "Elige en qué plataforma lo jugaste.")] int? PlatformId);

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

public record ProfileRatingDto(
    int GameId, string GameName, string? GameCover, decimal Score, string? Review, string? PlatformName, DateTime UpdatedAt);

public record PlatformDto(int Id, string Name, string Family);

public record PlayingGameDto(int GameId, string Name, string? CoverUrl, string? Description,
    double HoursPlayed, JournalEntryDto? LastEntry, int JournalCount);
public record JournalEntryDto(int Id, string Text, DateTime CreatedAt);
public record AddJournalEntryRequest([Required, StringLength(500, MinimumLength = 1)] string Text);
public record AddHoursRequest([Range(-100.0, 100.0)] double Hours);
public record HoursDto(double HoursPlayed);

public record MedalDto(
    string Id,
    string Name,
    string Description,
    string Icon,
    string Category,
    int Progress,
    int Target,
    bool Earned);

public record ProfileDto(
    string UserName,
    string? AvatarUrl,
    DateTime CreatedAt,
    int RatingsCount,
    double? AverageGiven,
    IReadOnlyList<TopGameDto> TopGames,
    IReadOnlyList<GenreDto> FavoriteGenres,
    IReadOnlyList<PlatformDto> Platforms,
    IReadOnlyList<ProfileRatingDto> RecentRatings,
    IReadOnlyList<PlayingGameDto> Playing,
    // Medallas que el usuario eligió mostrar (máx. 10, en su orden)
    IReadOnlyList<MedalDto> Medals,
    int MedalsEarned,
    int MedalsTotal,
    int ReviewsCount,
    int FinishedCount,
    int OlderNewerBest,
    int CoverQuizBest,
    // Mejor tiempo (segundos) para llegar a 1000 en Categorías; null si nunca ganó
    int? CategoryBestSeconds);

// ---------- Categorías ----------
public record CategoryStateDto(Guid RunId, int Round, int Score, int Goal, int Lives, int MaxLives, string Category,
    int SecondsPerRound, int MaxPoints, int MinPoints, bool RoundOver, bool GameOver, bool Won, int TotalSeconds,
    int? BestSeconds);
public record CategoryAnswerRequest(int GameId);
/// <summary>AlreadyUsed = ese juego ya salió en la partida (no cuenta ni castiga: se elige otro).</summary>
public record CategoryAnswerResultDto(bool Correct, bool AlreadyUsed, bool TimedOut, int Points, string? GameName,
    int? GameId, CategoryStateDto State, bool NewRecord = false);

// ---------- Adivina la portada ----------
public record CoverQuizStateDto(Guid RunId, int Round, int TotalRounds, int Score, int Attempts, int MaxAttempts,
    string Hint, string ImageUrl, int SecondsLeft, int SecondsPerRound, bool RoundOver, bool GameOver, int? Best,
    IReadOnlyList<int> PointsByAttempt);
public record CoverQuizGuessRequest([Required, StringLength(200)] string Text);
/// <summary>Answer/AnswerGameId solo se envían cuando la ronda ya terminó.</summary>
public record CoverQuizGuessResultDto(bool Correct, bool TimedOut, int Points, string? Answer, int? AnswerGameId,
    string? AnswerCoverUrl, bool NewRecord, CoverQuizStateDto State);
/// <summary>Un puesto en un top de récords. Position: los empates comparten puesto.</summary>
public record LeaderDto(int Position, string UserName, string? AvatarUrl, int Best);
/// <summary>Top 10 + el puesto del usuario actual (null si no inició sesión o no tiene récord).</summary>
public record LeaderboardDto(IReadOnlyList<LeaderDto> Top, LeaderDto? Me);

// ---------- Older/Newer ----------
/// <summary>Year = null en el juego que hay que adivinar.</summary>
public record OlderNewerGameDto(int GameId, string Name, string? CoverUrl, int? Year);
public record OlderNewerStateDto(Guid RunId, int Score, OlderNewerGameDto Left, OlderNewerGameDto Right, int? Best,
    int SecondsPerQuestion);
public record OlderNewerGuessRequest([Required] string Guess);
public record OlderNewerGuessResultDto(bool Correct, int RightYear, int Score, bool GameOver,
    OlderNewerGameDto? NextRight, int? Best, bool NewRecord, bool TimedOut);

public record UpdatePlayingRequest(List<int> GameIds);

/// <summary>Juego terminado. MyScore = la calificación que le dio el usuario, si lo calificó.</summary>
public record FinishedGameDto(int GameId, string Name, string? CoverUrl, DateTime FinishedAt, double HoursPlayed,
    double? Score, int JournalCount);

public record UpdateShowcaseMedalsRequest(List<string> MedalIds);

public record UpdatePlatformsRequest(List<int> PlatformIds);

public record UserSearchDto(string UserName, string? AvatarUrl, int Ratings);

public record UpdateTopGamesRequest([MaxLength(5)] List<int> GameIds);

public record UpdateFavoriteGenresRequest(List<int> GenreIds);

// ---------- Paginación ----------

public record PagedResultDto<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount, int TotalPages);
