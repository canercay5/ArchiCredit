using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Customer>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.NationalId).IsUnique();
            e.Property(c => c.FirstName).HasMaxLength(100).IsRequired();
            e.Property(c => c.LastName).HasMaxLength(100).IsRequired();
            e.Property(c => c.NationalId).HasMaxLength(11).IsRequired();
            e.Property(c => c.Email).HasMaxLength(200).IsRequired();
            e.Property(c => c.PhoneNumber).HasMaxLength(20);
        });

        builder.Entity<Loan>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.PrincipalAmount).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(l => l.MonthlyProfitRate).HasColumnType("decimal(5,2)").IsRequired();
            e.Property(l => l.MonthlyInstallmentAmount).HasColumnType("decimal(18,2)");
            e.Property(l => l.TotalRepayment).HasColumnType("decimal(18,2)");
            e.Property(l => l.RejectionReason).HasMaxLength(500);
            e.HasOne(l => l.Customer)
             .WithMany(c => c.Loans)
             .HasForeignKey(l => l.CustomerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Installment>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Amount).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(i => i.PrincipalPortion).HasColumnType("decimal(18,2)");
            e.Property(i => i.ProfitPortion).HasColumnType("decimal(18,2)");
            e.HasOne(i => i.Loan)
             .WithMany(l => l.Installments)
             .HasForeignKey(i => i.LoanId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Amount).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(p => p.TransactionId).HasMaxLength(100);
            e.HasIndex(p => p.InstallmentId).IsUnique();
            e.HasOne(p => p.Installment)
             .WithOne(i => i.Payment)
             .HasForeignKey<Payment>(p => p.InstallmentId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Username).HasMaxLength(100).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
            e.HasOne(u => u.Customer)
             .WithMany()
             .HasForeignKey(u => u.CustomerId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
