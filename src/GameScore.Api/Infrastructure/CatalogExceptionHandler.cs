using GameScore.Api.Catalog;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace GameScore.Api.Infrastructure;

/// <summary>
/// Convierte los errores al hablar con el catálogo de juegos (IGDB) en una respuesta 502 clara para el frontend.
/// </summary>
public class CatalogExceptionHandler(ILogger<CatalogExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not CatalogException catalogException) return false;

        logger.LogWarning(catalogException, "Error al consultar el catálogo de juegos");

        context.Response.StatusCode = StatusCodes.Status502BadGateway;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status502BadGateway,
            Title = "No se pudo obtener información de juegos.",
            Detail = catalogException.Message
        }, ct);

        return true;
    }
}
