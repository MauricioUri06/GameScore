using GameScore.Api.Data;
using GameScore.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Services;

/// <summary>Números de un usuario con los que se calculan sus medallas.</summary>
public record UserStats(
    int Ratings,
    int Reviews,
    int LikesReceived,
    int VotesGiven,
    int DaysSinceJoined,
    IReadOnlyDictionary<string, int> RatingsByGenre,
    int DistinctConsoles,
    int RetroGames,
    int ZeroStarRatings,
    int FiveStarRatings,
    int ProfileChecks,
    int Playing,
    int Finished);

/// <summary>
/// Medallas: se calculan a partir de la actividad del usuario (no se guardan), así que
/// agregar una nueva aquí la otorga de inmediato a quien ya cumpla la condición.
/// </summary>
public class MedalService(GameScoreDbContext db)
{
    private record Medal(string Id, string Name, string Description, string Icon, string Category, int Target,
        Func<UserStats, int> Value);

    private static Medal Genre(string id, string slug, string name, string icon, string genreName) =>
        new(id, name, $"Califica 5 juegos de {genreName}.", icon, "Géneros", 5,
            s => s.RatingsByGenre.GetValueOrDefault(slug));

    private static readonly Medal[] All =
    [
        // Reseñas (calificaciones con texto)
        new("review-1", "Primera reseña", "Escribe tu primera reseña.", "✍️", "Reseñas", 1, s => s.Reviews),
        new("review-10", "Crítico en ascenso", "Escribe 10 reseñas.", "📝", "Reseñas", 10, s => s.Reviews),
        new("review-50", "Crítico", "Escribe 50 reseñas.", "🖋️", "Reseñas", 50, s => s.Reviews),
        new("review-100", "Crítico legendario", "Escribe 100 reseñas.", "📜", "Reseñas", 100, s => s.Reviews),

        // Calificaciones
        new("rating-1", "Primer juego", "Califica tu primer juego.", "🎮", "Calificaciones", 1, s => s.Ratings),
        new("rating-25", "Jugador dedicado", "Califica 25 juegos.", "🕹️", "Calificaciones", 25, s => s.Ratings),
        new("rating-100", "Coleccionista", "Califica 100 juegos.", "📚", "Calificaciones", 100, s => s.Ratings),
        new("rating-250", "Leyenda", "Califica 250 juegos.", "🏆", "Calificaciones", 250, s => s.Ratings),

        // Comunidad
        new("likes-1", "Primer like", "Recibe un like en una reseña.", "👍", "Comunidad", 1, s => s.LikesReceived),
        new("likes-10", "Voz respetada", "Recibe 10 likes en tus reseñas.", "💬", "Comunidad", 10, s => s.LikesReceived),
        new("likes-50", "Influencer", "Recibe 50 likes en tus reseñas.", "🌟", "Comunidad", 50, s => s.LikesReceived),
        new("likes-100", "Ícono de la comunidad", "Recibe 100 likes en tus reseñas.", "👑", "Comunidad", 100, s => s.LikesReceived),
        new("votes-10", "Jurado", "Da like o dislike a 10 reseñas.", "⚖️", "Comunidad", 10, s => s.VotesGiven),

        // Antigüedad
        new("days-7", "Recién llegado", "Cumple una semana en GameScore.", "🌱", "Antigüedad", 7, s => s.DaysSinceJoined),
        new("days-30", "Habitual", "Cumple un mes en GameScore.", "📅", "Antigüedad", 30, s => s.DaysSinceJoined),
        new("days-180", "Veterano", "Cumple seis meses en GameScore.", "🛡️", "Antigüedad", 180, s => s.DaysSinceJoined),
        new("days-365", "Un año jugando", "Cumple un año en GameScore.", "🎂", "Antigüedad", 365, s => s.DaysSinceJoined),

        // Géneros (slugs de IGDB)
        Genre("genre-horror", "horror", "Sobreviviente", "👻", "terror"),
        Genre("genre-rpg", "role-playing-rpg", "Alma de rol", "🧙", "rol (RPG)"),
        Genre("genre-shooter", "shooter", "Gatillo fácil", "🎯", "disparos"),
        Genre("genre-platform", "platform", "Saltarín", "🍄", "plataformas"),
        Genre("genre-adventure", "adventure", "Aventurero", "🗺️", "aventura"),
        Genre("genre-strategy", "strategy", "Estratega", "♟️", "estrategia"),
        Genre("genre-fighting", "fighting", "Peleador", "🥊", "lucha"),
        Genre("genre-racing", "racing", "Piloto", "🏎️", "carreras"),
        Genre("genre-sport", "sport", "Deportista", "⚽", "deportes"),
        Genre("genre-puzzle", "puzzle", "Mente maestra", "🧩", "puzles"),
        Genre("genre-indie", "indie", "Corazón indie", "💜", "indie"),
        new("genre-variety", "Ecléctico", "Califica juegos de 10 géneros distintos.", "🎨", "Géneros", 10,
            s => s.RatingsByGenre.Count),

        // Especiales
        new("consoles-3", "Multiplataforma", "Califica juegos jugados en 3 consolas distintas.", "🔀", "Especiales", 3,
            s => s.DistinctConsoles),
        new("retro-5", "Arqueólogo", "Califica 5 juegos lanzados antes del 2000.", "🏺", "Especiales", 5, s => s.RetroGames),
        new("zero-1", "Implacable", "Dale 0 estrellas a un juego.", "💀", "Especiales", 1, s => s.ZeroStarRatings),
        new("five-10", "Corazón generoso", "Dale 5 estrellas a 10 juegos.", "❤️", "Especiales", 10, s => s.FiveStarRatings),
        new("profile-complete", "Perfil completo",
            "Ten foto de perfil, un top 5 completo, géneros favoritos y consolas.", "✨", "Especiales", 4,
            s => s.ProfileChecks),
        new("playing-1", "En partida", "Agrega un juego a \"Jugando ahora\".", "▶️", "Especiales", 1,
            s => s.Playing + s.Finished),
        new("finished-1", "Créditos finales", "Marca un juego como terminado.", "🏁", "Especiales", 1, s => s.Finished),
        new("finished-10", "Completista", "Termina 10 juegos.", "🏆", "Especiales", 10, s => s.Finished),
        new("finished-25", "Leyenda del mando", "Termina 25 juegos.", "🎮", "Especiales", 25, s => s.Finished),
    ];

    /// <summary>Todas las medallas con el progreso del usuario (obtenidas y por obtener).</summary>
    public async Task<List<MedalDto>> GetMedalsAsync(string userId, CancellationToken ct)
    {
        var stats = await GetStatsAsync(userId, ct);
        return All.Select(m =>
        {
            var value = m.Value(stats);
            return new MedalDto(m.Id, m.Name, m.Description, m.Icon, m.Category,
                Math.Min(value, m.Target), m.Target, value >= m.Target);
        }).ToList();
    }

    public async Task<UserStats> GetStatsAsync(string userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.CreatedAt,
                HasAvatar = u.AvatarUpdatedAt != null,
                TopGames = u.TopGames.Count(),
                FavoriteGenres = u.FavoriteGenres.Count(),
                Platforms = u.Platforms.Count(),
                Playing = u.CurrentlyPlaying.Count(),
                Finished = u.FinishedGames.Count()
            })
            .FirstAsync(ct);

        var ratings = db.Ratings.Where(r => r.UserId == userId);

        // Consultas simples y seguidas (todas se traducen a un COUNT en SQL)
        var total = await ratings.CountAsync(ct);
        var reviews = await ratings.CountAsync(r => r.Review != null, ct);
        var zero = await ratings.CountAsync(r => r.Score == 0, ct);
        var five = await ratings.CountAsync(r => r.Score == 5, ct);
        var retroLimit = new DateOnly(2000, 1, 1);
        var retro = await ratings.CountAsync(r => r.Game.Released != null && r.Game.Released < retroLimit, ct);
        var consoles = await ratings.Where(r => r.PlatformId != null).Select(r => r.PlatformId).Distinct().CountAsync(ct);

        var byGenre = await ratings
            .SelectMany(r => r.Game.Genres.Select(g => g.Slug))
            .GroupBy(slug => slug)
            .Select(g => new { Slug = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Slug, x => x.Count, ct);

        var likesReceived = await db.ReviewVotes.CountAsync(v => v.Rating.UserId == userId && v.Value == 1, ct);
        var votesGiven = await db.ReviewVotes.CountAsync(v => v.UserId == userId, ct);

        var profileChecks = (user.HasAvatar ? 1 : 0) + (user.TopGames >= 5 ? 1 : 0)
                            + (user.FavoriteGenres > 0 ? 1 : 0) + (user.Platforms > 0 ? 1 : 0);

        return new UserStats(
            total,
            reviews,
            likesReceived,
            votesGiven,
            Math.Max(0, (int)(DateTime.UtcNow - user.CreatedAt).TotalDays),
            byGenre,
            consoles,
            retro,
            zero,
            five,
            profileChecks,
            user.Playing,
            user.Finished);
    }
}
