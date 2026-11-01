namespace GameScore.Api.Entities;

/// <summary>Like (+1) o dislike (-1) de un usuario a la reseña de otro. Uno por usuario y reseña.</summary>
public class ReviewVote
{
    public int RatingId { get; set; }
    public Rating Rating { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    /// <summary>+1 = like, -1 = dislike.</summary>
    public short Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
