using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class ReviewVoteConfiguration : IEntityTypeConfiguration<ReviewVote>
{
    public void Configure(EntityTypeBuilder<ReviewVote> builder)
    {
        builder.HasKey(v => new { v.RatingId, v.UserId });
        builder.ToTable(t => t.HasCheckConstraint("CK_ReviewVotes_Value", "\"Value\" IN (-1, 1)"));

        builder.HasOne(v => v.Rating)
            .WithMany(r => r.Votes)
            .HasForeignKey(v => v.RatingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
