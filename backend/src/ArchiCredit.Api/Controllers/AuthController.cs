using ArchiCredit.Application.DTOs.Auth;
using ArchiCredit.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService authService,
    IValidator<LoginDto> loginValidator,
    IValidator<RegisterCustomerDto> registerCustomerValidator,
    IValidator<ResetPasswordDto> resetPasswordValidator) : ControllerBase
{
    [HttpPost("register")]
    //[Authorize(Roles = "Admin")]
    public async Task<ActionResult<AuthResultDto>> Register([FromBody] RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return Ok(result);
    }

    [HttpPost("register-customer")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResultDto>> RegisterCustomer([FromBody] RegisterCustomerDto dto)
    {
        var validation = await registerCustomerValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => e.ErrorMessage));

        var result = await authService.RegisterCustomerAsync(dto);
        return CreatedAtAction(null, result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResultDto>> Login([FromBody] LoginDto dto)
    {
        var validation = await loginValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => e.ErrorMessage));

        var result = await authService.LoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var validation = await resetPasswordValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => e.ErrorMessage));

        await authService.ResetPasswordAsync(dto);
        return Ok(new { message = "Şifreniz başarıyla güncellendi." });
    }
}
