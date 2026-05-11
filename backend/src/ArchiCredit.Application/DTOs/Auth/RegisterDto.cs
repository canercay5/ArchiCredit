using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.DTOs.Auth;

public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public Guid? CustomerId { get; set; }
}
