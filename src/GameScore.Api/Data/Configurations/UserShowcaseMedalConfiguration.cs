using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class UserShowcaseMedalConfiguration : IEntityTypeConfiguration<UserShowcaseMedal>
{
    public void Configure(EntityTypeBuilder<UserShowcaseMedal> builder)
    {
        builder.ToTable("UserShowcaseMedals");
        builder.HasKey(m => new { m.UserId, m.MedalId });
        builder.Property(m => m.MedalId).HasMaxLength(50);

        builder.HasOne(m => m.User)
            .WithMany(u => u.ShowcaseMedals)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
