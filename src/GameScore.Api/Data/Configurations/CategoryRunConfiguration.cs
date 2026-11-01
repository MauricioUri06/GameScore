using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class CategoryRunConfiguration : IEntityTypeConfiguration<CategoryRun>
{
    public void Configure(EntityTypeBuilder<CategoryRun> builder)
    {
        builder.ToTable("CategoryRuns");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.GenreName).HasMaxLength(100);
        builder.HasIndex(r => new { r.UserId, r.Won, r.TotalSeconds });
        builder.HasIndex(r => r.UpdatedAt);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
