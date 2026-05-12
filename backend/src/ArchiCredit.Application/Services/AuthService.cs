using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ArchiCredit.Application.DTOs.Auth;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
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

        return BuildResult(user);
    }

    public async Task<AuthResultDto> RegisterCustomerAsync(RegisterCustomerDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Username == dto.Username))
            throw new BusinessRuleException($"Username '{dto.Username}' is already taken.");

        if (await db.Customers.AnyAsync(c => c.NationalId == dto.NationalId))
            throw new BusinessRuleException($"A customer with this national ID already exists.");

        var customer = new Customer
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            NationalId = dto.NationalId,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            DateOfBirth = dto.DateOfBirth
        };
        db.Customers.Add(customer);

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Customer,
            CustomerId = customer.Id
        };
        db.Users.Add(user);

        await db.SaveChangesAsync();
        return BuildResult(user);
    }

    public async Task<AuthResultDto> LoginAsync(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username)
            ?? throw new BusinessRuleException("Invalid username or password.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new BusinessRuleException("Invalid username or password.");

        return BuildResult(user);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await db.Users
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Username == dto.Username)
            ?? throw new BusinessRuleException("Invalid username or national ID.");

        if (user.Customer == null || user.Customer.NationalId != dto.NationalId)
            throw new BusinessRuleException("Invalid username or national ID.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await db.SaveChangesAsync();
    }

    private AuthResultDto BuildResult(User user) => new()
    {
        Token = GenerateToken(user),
        Username = user.Username,
        Role = user.Role.ToString(),
        CustomerId = user.CustomerId
    };

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
