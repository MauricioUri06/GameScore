using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class PlayingJournalEntryConfiguration : IEntityTypeConfiguration<PlayingJournalEntry>
{
    public const int MaxTextLength = 500;

    public void Configure(EntityTypeBuilder<PlayingJournalEntry> builder)
    {
        builder.ToTable("PlayingJournalEntries");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Text).HasMaxLength(MaxTextLength).IsRequired();
        builder.HasIndex(e => new { e.UserId, e.GameId, e.CreatedAt });

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Game)
            .WithMany()
            .HasForeignKey(e => e.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
