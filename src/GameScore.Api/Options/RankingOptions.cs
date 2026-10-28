namespace GameScore.Api.Options;

public class RankingOptions
{
    public const string Section = "Ranking";

    /// <summary>
    /// "m" del promedio bayesiano: cuántas calificaciones "ficticias" con el promedio global
    /// se mezclan con las reales. Evita que un juego con una sola nota de 5 quede primero.
    /// </summary>
    public int MinVotes { get; set; } = 3;
}
