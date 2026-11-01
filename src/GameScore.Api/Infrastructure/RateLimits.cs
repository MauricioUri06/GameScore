namespace GameScore.Api.Infrastructure;

public static class RateLimits
{
    /// <summary>
    /// Límite para registro e inicio de sesión: 10 peticiones por minuto por IP.
    /// Junto con el bloqueo de cuenta tras 5 fallos, hace inviable adivinar una clave de 6 dígitos.
    /// </summary>
    public const string Auth = "auth";
}
