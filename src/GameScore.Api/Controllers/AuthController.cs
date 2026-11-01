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
public class AuthController(UserManager<AppUser> userManager, TokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var userName = request.UserName.Trim();
        var user = new AppUser
        {
            UserName = userName,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? userName : request.DisplayName.Trim()
        };

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
        var user = await userManager.FindByNameAsync(request.UserName.Trim());
        if (user is null)
            return Unauthorized(new ProblemDetails { Title = "Nickname o clave incorrectos." });

        if (await userManager.IsLockedOutAsync(user))
            return LockedOut(user);

        if (!await userManager.CheckPasswordAsync(user, request.Pin))
        {
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
        new(user.Id, user.UserName!, user.DisplayName, user.AvatarUrl);

    private static string TranslateIdentityError(IdentityError error) => error.Code switch
    {
        "DuplicateUserName" => "Ese nickname ya está en uso.",
        "InvalidUserName" => "El nickname no es válido.",
        "PasswordTooShort" => "La clave debe tener 6 dígitos.",
        "PasswordRequiresDigit" => "La clave debe tener solo números.",
        _ => error.Description
    };
}
