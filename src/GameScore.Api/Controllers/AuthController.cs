using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GameScore.Api.Controllers;

/// <summary>
/// Registro e inicio de sesión con nickname + clave de 6 dígitos.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<AppUser> userManager,
    TokenService tokenService,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var userName = request.UserName.Trim();
        var user = new AppUser { UserName = userName };

        var result = await userManager.CreateAsync(user, request.Pin);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, TranslateIdentityError(error));
            return ValidationProblem(ModelState);
        }

        return Ok(BuildResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var userName = request.UserName.Trim();
        var pin = new string(request.Pin.Where(char.IsDigit).ToArray());

        var user = await userManager.FindByNameAsync(userName);
        if (user is null)
        {
            logger.LogInformation("Login fallido: no existe el nickname '{UserName}'", userName);
            return Unauthorized(new ProblemDetails { Title = "Nickname o clave incorrectos." });
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            logger.LogInformation("Login rechazado: la cuenta '{UserName}' está bloqueada", userName);
            return LockedOut(user);
        }

        if (!await userManager.CheckPasswordAsync(user, pin))
        {
            logger.LogInformation("Login fallido: clave incorrecta para '{UserName}' (recibidos {Digits} dígitos)",
                userName, pin.Length);

            // Cuenta el intento fallido; al llegar al máximo, Identity bloquea la cuenta un rato
            await userManager.AccessFailedAsync(user);
            if (await userManager.IsLockedOutAsync(user))
                return LockedOut(user);

            return Unauthorized(new ProblemDetails { Title = "Nickname o clave incorrectos." });
        }

        await userManager.ResetAccessFailedCountAsync(user);
        return Ok(BuildResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> Me()
    {
        var user = await userManager.FindByIdAsync(User.GetRequiredUserId());
        if (user is null) return Unauthorized();
        return ToDto(user);
    }

    private ObjectResult LockedOut(AppUser user)
    {
        var minutes = user.LockoutEnd is { } end
            ? Math.Max(1, (int)Math.Ceiling((end - DateTimeOffset.UtcNow).TotalMinutes))
            : 15;

        return StatusCode(StatusCodes.Status429TooManyRequests, new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = $"Demasiados intentos fallidos. Intenta de nuevo en {minutes} min."
        });
    }

    private AuthResponse BuildResponse(AppUser user)
    {
        var (token, expiresAt) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAt, ToDto(user));
    }

    private static CurrentUserDto ToDto(AppUser user) =>
        new(user.Id, user.UserName!, AvatarUrls.For(user.UserName!, user.AvatarUpdatedAt));

    private static string TranslateIdentityError(IdentityError error) => error.Code switch
    {
        "DuplicateUserName" => "Ese nickname ya está en uso.",
        "InvalidUserName" => "El nickname no es válido.",
        "PasswordTooShort" => "La clave debe tener 6 dígitos.",
        "PasswordRequiresDigit" => "La clave debe tener solo números.",
        _ => error.Description
    };
}
