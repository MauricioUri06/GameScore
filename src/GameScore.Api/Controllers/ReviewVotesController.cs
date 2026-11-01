using GameScore.Api.Data;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameScore.Api.Controllers;

/// <summary>Likes y dislikes a las reseñas.</summary>
[ApiController]
[Authorize]
[Route("api/reviews")]
public class ReviewVotesController(GameScoreDbContext db) : ControllerBase
{
    public record VoteRequest(short Value);
    public record VoteResult(int Likes, int Dislikes, short MyVote);

    /// <summary>Value: 1 = like, -1 = dislike, 0 = quitar mi voto.</summary>
    [HttpPut("{ratingId:int}/vote")]
    public async Task<ActionResult<VoteResult>> Vote(int ratingId, VoteRequest request, CancellationToken ct)
    {
        if (request.Value is not (-1 or 0 or 1))
            return Problem(title: "El voto debe ser 1, -1 o 0.", statusCode: StatusCodes.Status400BadRequest);

        var userId = User.GetRequiredUserId();
        var rating = await db.Ratings.AsNoTracking()
            .Select(r => new { r.Id, r.UserId })
            .FirstOrDefaultAsync(r => r.Id == ratingId, ct);
        if (rating is null) return NotFound();
        if (rating.UserId == userId)
            return Problem(title: "No puedes votar tu propia reseña.", statusCode: StatusCodes.Status400BadRequest);

        var vote = await db.ReviewVotes.FirstOrDefaultAsync(v => v.RatingId == ratingId && v.UserId == userId, ct);
        if (request.Value == 0)
        {
            if (vote is not null) db.ReviewVotes.Remove(vote);
        }
        else if (vote is null)
        {
            db.ReviewVotes.Add(new ReviewVote { RatingId = ratingId, UserId = userId, Value = request.Value });
        }
        else
        {
            vote.Value = request.Value;
        }

        await db.SaveChangesAsync(ct);

        var likes = await db.ReviewVotes.CountAsync(v => v.RatingId == ratingId && v.Value == 1, ct);
        var dislikes = await db.ReviewVotes.CountAsync(v => v.RatingId == ratingId && v.Value == -1, ct);
        return new VoteResult(likes, dislikes, request.Value);
    }
}
