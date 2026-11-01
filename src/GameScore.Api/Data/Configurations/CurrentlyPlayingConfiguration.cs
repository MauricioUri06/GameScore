using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class CurrentlyPlayingConfiguration : IEntityTypeConfiguration<CurrentlyPlaying>
{
    public void Configure(EntityTypeBuilder<CurrentlyPlaying> builder)
    {
        builder.HasKey(p => new { p.UserId, p.GameId });
        builder.ToTable("CurrentlyPlaying", t => t.HasCheckConstraint("CK_CurrentlyPlaying_Hours", "\"HoursPlayed\" >= 0"));

        builder.HasOne(p => p.User)
            .WithMany(u => u.CurrentlyPlaying)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Game)
            .WithMany()
            .HasForeignKey(p => p.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
