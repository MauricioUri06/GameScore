namespace GameScore.Api.Entities;

/// <summary>
/// Foto de perfil de un usuario. Va en su propia tabla para no cargar los bytes
/// cada vez que se consulta un usuario. El frontend la recorta a 256x256 antes de subirla.
/// </summary>
public class UserAvatar
{
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public byte[] Data { get; set; } = [];
    public string ContentType { get; set; } = "image/jpeg";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
