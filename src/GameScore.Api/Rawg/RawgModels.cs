namespace GameScore.Api.Rawg;

// Modelos que reflejan las respuestas JSON de RAWG.
// Se deserializan con política snake_case (background_image -> BackgroundImage).

public record RawgPage<T>(int Count, string? Next, string? Previous, List<T> Results);

public record RawgGenre(int Id, string Name, string Slug);

public record RawgPlatformWrapper(RawgPlatform Platform);

public record RawgPlatform(int Id, string Name, string Slug);

public record RawgGameListItem(
    int Id,
    string Slug,
    string Name,
    string? Released,
    string? BackgroundImage,
    List<RawgGenre>? Genres);

public record RawgDeveloper(int Id, string Name, string Slug);

public record RawgGameDetail(
    int Id,
    string Slug,
    string Name,
    string? Released,
    string? BackgroundImage,
    string? DescriptionRaw,
    int? Metacritic,
    List<RawgGenre>? Genres,
    List<RawgPlatformWrapper>? Platforms,
    List<RawgDeveloper>? Developers);
