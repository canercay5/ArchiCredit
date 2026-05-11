using ArchiCredit.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Customer> Customers { get; }
    DbSet<Loan> Loans { get; }
    DbSet<Installment> Installments { get; }
    DbSet<Payment> Payments { get; }
    DbSet<User> Users { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
