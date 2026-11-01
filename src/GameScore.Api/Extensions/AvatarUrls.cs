namespace GameScore.Api.Extensions;

public static class AvatarUrls
{
    /// <summary>
    /// URL pública de la foto de perfil, o null si el usuario no tiene foto.
    /// Lleva la fecha de actualización (?v=) para que el navegador la pueda guardar en caché
    /// y aun así vea la nueva cuando el usuario la cambie.
    /// </summary>
    public static string? For(string userName, DateTime? updatedAt) =>
        updatedAt is null ? null : $"/api/users/{Uri.EscapeDataString(userName)}/avatar?v={updatedAt.Value.Ticks}";
}
