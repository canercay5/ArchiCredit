using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ArchiCredit.Application.DTOs.Auth;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ArchiCredit.Application.Services;

public class AuthService(IAppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<AuthResultDto> RegisterAsync(RegisterDto dto)
    {
        var exists = await db.Users.AnyAsync(u => u.Username == dto.Username);
        if (exists)
            throw new BusinessRuleException($"Username '{dto.Username}' is already taken.");

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            CustomerId = dto.CustomerId
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthResultDto
        {
            Token = GenerateToken(user),
            Username = user.Username,
            Role = user.Role.ToString(),
            CustomerId = user.CustomerId
        };
    }

    public async Task<AuthResultDto> LoginAsync(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username)
            ?? throw new BusinessRuleException("Invalid username or password.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new BusinessRuleException("Invalid username or password.");

        return new AuthResultDto
        {
            Token = GenerateToken(user),
            Username = user.Username,
            Role = user.Role.ToString(),
            CustomerId = user.CustomerId
        };
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("customerId", user.CustomerId?.ToString() ?? string.Empty)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
