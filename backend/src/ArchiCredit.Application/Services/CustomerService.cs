using ArchiCredit.Application.DTOs.Customer;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Services;

public class CustomerService(IAppDbContext db) : ICustomerService
{
    public async Task<IEnumerable<CustomerDto>> GetAllAsync()
    {
        return await db.Customers
            .OrderBy(c => c.LastName)
            .Select(c => MapToDto(c))
            .ToListAsync();
    }

    public async Task<CustomerDto> GetByIdAsync(Guid id)
    {
        var customer = await db.Customers.FindAsync(id)
            ?? throw new NotFoundException(nameof(Customer), id);
        return MapToDto(customer);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto)
    {
        var exists = await db.Customers.AnyAsync(c => c.NationalId == dto.NationalId);
        if (exists)
            throw new BusinessRuleException($"A customer with NationalId '{dto.NationalId}' already exists.");

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
        await db.SaveChangesAsync();
        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerDto dto)
    {
        var customer = await db.Customers.FindAsync(id)
            ?? throw new NotFoundException(nameof(Customer), id);

        customer.FirstName = dto.FirstName;
        customer.LastName = dto.LastName;
        customer.Email = dto.Email;
        customer.PhoneNumber = dto.PhoneNumber;
        customer.DateOfBirth = dto.DateOfBirth;
        customer.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return MapToDto(customer);
    }

    public async Task DeleteAsync(Guid id)
    {
        var customer = await db.Customers.FindAsync(id)
            ?? throw new NotFoundException(nameof(Customer), id);

        var hasActiveLoans = await db.Loans
            .AnyAsync(l => l.CustomerId == id && l.Status == Domain.Enums.LoanStatus.Active);
        if (hasActiveLoans)
            throw new BusinessRuleException("Cannot delete a customer with active loans.");

        db.Customers.Remove(customer);
        await db.SaveChangesAsync();
    }

    private static CustomerDto MapToDto(Customer c) => new()
    {
        Id = c.Id,
        FirstName = c.FirstName,
        LastName = c.LastName,
        NationalId = c.NationalId,
        Email = c.Email,
        PhoneNumber = c.PhoneNumber,
        DateOfBirth = c.DateOfBirth,
        CreatedAt = c.CreatedAt
    };
}
