using ArchiCredit.Application.DTOs.Auth;

namespace ArchiCredit.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResultDto> RegisterAsync(RegisterDto dto);
    Task<AuthResultDto> RegisterCustomerAsync(RegisterCustomerDto dto);
    Task<AuthResultDto> LoginAsync(LoginDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
}
