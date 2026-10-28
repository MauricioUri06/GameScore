using GameScore.Api.Dtos;
using GameScore.Api.Entities;
using GameScore.Api.Extensions;
using GameScore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GameScore.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<AppUser> userManager, TokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var user = new AppUser
        {
            UserName = request.UserName.Trim(),
            Email = request.Email.Trim(),
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? request.UserName.Trim()
                : request.DisplayName.Trim()
        };

        var result = await userManager.CreateAsync(user, request.Password);
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
        var login = request.UserNameOrEmail.Trim();
        var user = login.Contains('@')
            ? await userManager.FindByEmailAsync(login)
            : await userManager.FindByNameAsync(login);

        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new ProblemDetails { Title = "Usuario o contraseña incorrectos." });

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

    private AuthResponse BuildResponse(AppUser user)
    {
        var (token, expiresAt) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAt, ToDto(user));
    }

    private static CurrentUserDto ToDto(AppUser user) =>
        new(user.Id, user.UserName!, user.DisplayName, user.Email!, user.AvatarUrl);

    private static string TranslateIdentityError(IdentityError error) => error.Code switch
    {
        "DuplicateUserName" => "Ese nombre de usuario ya está en uso.",
        "DuplicateEmail" => "Ese correo ya está registrado.",
        "InvalidUserName" => "El nombre de usuario no es válido.",
        "InvalidEmail" => "El correo no es válido.",
        "PasswordTooShort" => "La contraseña debe tener al menos 8 caracteres.",
        "PasswordRequiresDigit" => "La contraseña debe tener al menos un número.",
        "PasswordRequiresLower" => "La contraseña debe tener al menos una minúscula.",
        "PasswordRequiresUpper" => "La contraseña debe tener al menos una mayúscula.",
        _ => error.Description
    };
}
