using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class OlderNewerRunConfiguration : IEntityTypeConfiguration<OlderNewerRun>
{
    public void Configure(EntityTypeBuilder<OlderNewerRun> builder)
    {
        builder.ToTable("OlderNewerRuns");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.LeftName).HasMaxLength(300);
        builder.Property(r => r.RightName).HasMaxLength(300);
        builder.HasIndex(r => new { r.UserId, r.Score });
        builder.HasIndex(r => r.UpdatedAt);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
