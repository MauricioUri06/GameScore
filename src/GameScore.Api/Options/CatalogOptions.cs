namespace GameScore.Api.Options;

public class CatalogOptions
{
    public const string Section = "Catalog";

    /// <summary>Días antes de volver a pedir al catálogo los datos de un juego ya guardado.</summary>
    public int CacheDays { get; set; } = 7;
}
