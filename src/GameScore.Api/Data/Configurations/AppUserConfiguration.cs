using GameScore.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameScore.Api.Data.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.Property(u => u.DisplayName).HasMaxLength(50).IsRequired();
        builder.Property(u => u.Bio).HasMaxLength(300);
        builder.Property(u => u.AvatarUrl).HasMaxLength(500);
    }
}
