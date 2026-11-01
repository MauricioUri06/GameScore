namespace GameScore.Api.Catalog.Igdb;

/// <summary>Nombres en español de los géneros y temáticas de IGDB (por slug).</summary>
public static class IgdbGenreNames
{
    /// <summary>Temáticas que no mostramos ni dejamos aparecer en búsquedas.</summary>
    public static readonly HashSet<string> HiddenThemes = ["erotic"];

    /// <summary>Id de la temática "Erotic" en IGDB, usada para filtrar en las consultas.</summary>
    public const int EroticThemeId = 42;

    private static readonly Dictionary<string, string> Spanish = new(StringComparer.OrdinalIgnoreCase)
    {
        // Géneros
        ["point-and-click"] = "Point & click",
        ["fighting"] = "Lucha",
        ["shooter"] = "Disparos (shooter)",
        ["music"] = "Música y ritmo",
        ["platform"] = "Plataformas",
        ["puzzle"] = "Puzles",
        ["racing"] = "Carreras",
        ["real-time-strategy-rts"] = "Estrategia en tiempo real",
        ["role-playing-rpg"] = "Rol (RPG)",
        ["simulator"] = "Simulación",
        ["sport"] = "Deportes",
        ["strategy"] = "Estrategia",
        ["turn-based-strategy-tbs"] = "Estrategia por turnos",
        ["tactical"] = "Táctico",
        ["hack-and-slash-beat-em-up"] = "Hack and slash / Beat 'em up",
        ["quiz-trivia"] = "Preguntas y trivia",
        ["pinball"] = "Pinball",
        ["adventure"] = "Aventura",
        ["indie"] = "Indie",
        ["arcade"] = "Arcade",
        ["visual-novel"] = "Novela visual",
        ["card-and-board-game"] = "Cartas y tablero",
        ["moba"] = "MOBA",

        // Temáticas
        ["action"] = "Acción",
        ["fantasy"] = "Fantasía",
        ["science-fiction"] = "Ciencia ficción",
        ["horror"] = "Terror",
        ["thriller"] = "Suspenso",
        ["survival"] = "Supervivencia",
        ["historical"] = "Histórico",
        ["stealth"] = "Sigilo",
        ["comedy"] = "Comedia",
        ["business"] = "Gestión y negocios",
        ["drama"] = "Drama",
        ["non-fiction"] = "No ficción",
        ["sandbox"] = "Sandbox",
        ["educational"] = "Educativo",
        ["kids"] = "Infantil",
        ["open-world"] = "Mundo abierto",
        ["warfare"] = "Bélico",
        ["party"] = "Party / fiesta",
        ["4x-explore-expand-exploit-and-exterminate"] = "4X",
        ["mystery"] = "Misterio",
        ["romance"] = "Romance",
    };

    public static string Translate(string? slug, string? fallback) =>
        slug is not null && Spanish.TryGetValue(slug, out var name) ? name : fallback ?? slug ?? "?";
}
