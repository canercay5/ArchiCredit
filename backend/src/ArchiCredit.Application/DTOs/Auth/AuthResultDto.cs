namespace ArchiCredit.Application.DTOs.Auth;

public class AuthResultDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
}
