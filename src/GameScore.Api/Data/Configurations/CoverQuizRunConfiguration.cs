using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class CoverQuizRunConfiguration : IEntityTypeConfiguration<CoverQuizRun>
{
    public void Configure(EntityTypeBuilder<CoverQuizRun> builder)
    {
        builder.ToTable("CoverQuizRuns");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.GameName).HasMaxLength(300);
        builder.Property(r => r.CoverUrl).HasMaxLength(500);
        builder.HasIndex(r => new { r.UserId, r.Score });
        builder.HasIndex(r => r.UpdatedAt);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
