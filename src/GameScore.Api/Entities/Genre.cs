namespace GameScore.Api.Entities;

public class Genre
{
    public int Id { get; set; }
    public int RawgId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public ICollection<Game> Games { get; set; } = new List<Game>();
}
