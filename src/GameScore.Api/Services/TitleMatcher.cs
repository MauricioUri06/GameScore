using System.Globalization;
using System.Text;

namespace GameScore.Api.Services;

/// <summary>
/// Compara lo que escribe el jugador con el nombre real del juego, siendo tolerante:
/// ignora mayúsculas, tildes y signos; acepta números romanos o arábigos ("II" = "2");
/// acepta solo el subtítulo ("Breath of the Wild") y pequeños errores de escritura.
/// </summary>
public static class TitleMatcher
{
    private static readonly Dictionary<string, string> Numerals = new()
    {
        ["i"] = "1", ["ii"] = "2", ["iii"] = "3", ["iv"] = "4", ["v"] = "5",
        ["vi"] = "6", ["vii"] = "7", ["viii"] = "8", ["ix"] = "9", ["x"] = "10",
        ["xi"] = "11", ["xii"] = "12", ["xiii"] = "13", ["xiv"] = "14", ["xv"] = "15", ["xvi"] = "16",
    };

    public static bool Matches(string guess, string title)
    {
        var g = Normalize(guess);
        if (g.Length == 0) return false;

        foreach (var candidate in Candidates(title))
        {
            if (candidate.Length == 0) continue;
            if (g == candidate) return true;
            // Errores de escritura: hasta 1 letra cada 6 (mín. 1) en títulos de 5+ letras
            if (candidate.Length >= 5 && Levenshtein(g, candidate) <= Math.Max(1, candidate.Length / 6)) return true;
        }

        return false;
    }

    /// <summary>Formas válidas del título: completo, sin artículo inicial y el subtítulo tras ":" o " - ".</summary>
    private static IEnumerable<string> Candidates(string title)
    {
        var full = Normalize(title);
        yield return full;
        if (full.StartsWith("the ")) yield return full[4..];

        foreach (var separator in new[] { ":", " - ", " – " })
        {
            var index = title.IndexOf(separator, StringComparison.Ordinal);
            if (index <= 0) continue;
            var subtitle = Normalize(title[(index + separator.Length)..]);
            // Solo subtítulos con suficiente información ("Breath of the Wild", no "II")
            if (subtitle.Length >= 6) yield return subtitle;
            var main = Normalize(title[..index]);
            // El título principal solo vale si el subtítulo es muy corto (ej. "Persona 5: Royal" → "persona 5")
            if (main.Length >= 4 && subtitle.Length <= 5) yield return main;
        }
    }

    public static string Normalize(string text)
    {
        var decomposed = text.Replace("&", " and ").ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            sb.Append(char.IsLetterOrDigit(c) ? c : ' ');
        }

        var words = sb.ToString()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => Numerals.GetValueOrDefault(w, w));
        return string.Join(' ', words);
    }

    private static int Levenshtein(string a, string b)
    {
        var previous = new int[b.Length + 1];
        var current = new int[b.Length + 1];
        for (var j = 0; j <= b.Length; j++) previous[j] = j;

        for (var i = 1; i <= a.Length; i++)
        {
            current[0] = i;
            for (var j = 1; j <= b.Length; j++)
            {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                current[j] = Math.Min(Math.Min(current[j - 1] + 1, previous[j] + 1), previous[j - 1] + cost);
            }

            (previous, current) = (current, previous);
        }

        return previous[b.Length];
    }

    /// <summary>
    /// Pista del título con letras ocultas. Con cada intento se revelan más:
    /// 0 = solo la forma ("_____ ______"), 1 = primera letra de cada palabra, 2 = ~35 %, 3 = ~60 %.
    /// Es determinista para la misma partida (no cambia al recargar).
    /// </summary>
    public static string Hint(string title, int attempts, int seed)
    {
        var chars = title.ToCharArray();
        var letterIndexes = Enumerable.Range(0, chars.Length).Where(i => char.IsLetterOrDigit(chars[i])).ToList();
        var revealed = new HashSet<int>();

        if (attempts >= 1)
        {
            for (var i = 0; i < chars.Length; i++)
                if (char.IsLetterOrDigit(chars[i]) && (i == 0 || !char.IsLetterOrDigit(chars[i - 1])))
                    revealed.Add(i);
        }

        if (attempts >= 2)
        {
            var share = attempts >= 3 ? 0.6 : 0.35;
            var random = new Random(seed);
            foreach (var i in letterIndexes.OrderBy(_ => random.Next()).Take((int)(letterIndexes.Count * share)))
                revealed.Add(i);
        }

        var sb = new StringBuilder(chars.Length);
        for (var i = 0; i < chars.Length; i++)
            sb.Append(char.IsLetterOrDigit(chars[i]) && !revealed.Contains(i) ? '_' : chars[i]);
        return sb.ToString();
    }
}
