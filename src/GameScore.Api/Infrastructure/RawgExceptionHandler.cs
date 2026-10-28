using GameScore.Api.Rawg;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace GameScore.Api.Infrastructure;

/// <summary>
/// Convierte los errores al hablar con RAWG en una respuesta 502 clara para el frontend.
/// </summary>
public class RawgExceptionHandler(ILogger<RawgExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not RawgException rawgException) return false;

        logger.LogWarning(rawgException, "Error al consultar RAWG");

        context.Response.StatusCode = StatusCodes.Status502BadGateway;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status502BadGateway,
            Title = "No se pudo obtener información de juegos.",
            Detail = rawgException.Message
        }, ct);

        return true;
    }
}
