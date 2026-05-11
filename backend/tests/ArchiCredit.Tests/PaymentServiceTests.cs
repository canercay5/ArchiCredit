using ArchiCredit.Application.DTOs.Payment;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Application.Services;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
using ArchiCredit.Domain.Exceptions;
using ArchiCredit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace ArchiCredit.Tests;

public class PaymentServiceTests
{
    private static IAppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ValidInstallment_CreatesPaymentAndMarksPaid()
    {
        var db = CreateInMemoryContext();
        var gateway = new Mock<IPaymentGatewayService>();
        gateway.Setup(g => g.ProcessAsync(It.IsAny<decimal>()))
            .ReturnsAsync(new PaymentGatewayResult(true, "TXN-123", null));

        var customer = new Customer { Id = Guid.NewGuid(), FirstName = "A", LastName = "B", NationalId = "12345678901" };
        var loan = new Loan { Id = Guid.NewGuid(), CustomerId = customer.Id, Customer = customer, PrincipalAmount = 1000, TermMonths = 12, Status = LoanStatus.Active };
        var installment = new Installment { Id = Guid.NewGuid(), LoanId = loan.Id, Loan = loan, Amount = 100, Status = InstallmentStatus.Unpaid, InstallmentNumber = 1, DueDate = DateTime.UtcNow.AddMonths(1) };

        db.Customers.Add(customer);
        db.Loans.Add(loan);
        db.Installments.Add(installment);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, gateway.Object);
        var result = await service.CreateAsync(new CreatePaymentDto { InstallmentId = installment.Id, Amount = 100 });

        Assert.Equal(PaymentStatus.Success, result.Status);

        var updated = await db.Installments.FindAsync(installment.Id);
        Assert.Equal(InstallmentStatus.Paid, updated!.Status);
        Assert.NotNull(updated.PaidAt);
    }

    [Fact]
    public async Task CreateAsync_AlreadyPaidInstallment_ThrowsBusinessRuleException()
    {
        var db = CreateInMemoryContext();
        var gateway = new Mock<IPaymentGatewayService>();
        var loan = new Loan { Id = Guid.NewGuid(), PrincipalAmount = 1000, TermMonths = 12, Status = LoanStatus.Active };
        var installment = new Installment { Id = Guid.NewGuid(), LoanId = loan.Id, Loan = loan, Amount = 100, Status = InstallmentStatus.Paid, InstallmentNumber = 1, DueDate = DateTime.UtcNow.AddMonths(1) };

        db.Loans.Add(loan);
        db.Installments.Add(installment);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, gateway.Object);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.CreateAsync(new CreatePaymentDto { InstallmentId = installment.Id, Amount = 100 }));
    }

    [Fact]
    public async Task CreateAsync_NonExistentInstallment_ThrowsNotFoundException()
    {
        var db = CreateInMemoryContext();
        var gateway = new Mock<IPaymentGatewayService>();
        var service = new PaymentService(db, gateway.Object);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.CreateAsync(new CreatePaymentDto { InstallmentId = Guid.NewGuid(), Amount = 100 }));
    }

    [Fact]
    public async Task CreateAsync_LastInstallmentPaid_ClosesLoan()
    {
        var db = CreateInMemoryContext();
        var gateway = new Mock<IPaymentGatewayService>();
        gateway.Setup(g => g.ProcessAsync(It.IsAny<decimal>()))
            .ReturnsAsync(new PaymentGatewayResult(true, "TXN-456", null));

        var customer = new Customer { Id = Guid.NewGuid(), FirstName = "A", LastName = "B", NationalId = "12345678901" };
        var loan = new Loan { Id = Guid.NewGuid(), CustomerId = customer.Id, Customer = customer, PrincipalAmount = 200, TermMonths = 2, Status = LoanStatus.Active };
        var inst1 = new Installment { Id = Guid.NewGuid(), LoanId = loan.Id, Loan = loan, Amount = 100, Status = InstallmentStatus.Paid, InstallmentNumber = 1, DueDate = DateTime.UtcNow };
        var inst2 = new Installment { Id = Guid.NewGuid(), LoanId = loan.Id, Loan = loan, Amount = 100, Status = InstallmentStatus.Unpaid, InstallmentNumber = 2, DueDate = DateTime.UtcNow.AddMonths(1) };

        db.Customers.Add(customer);
        db.Loans.Add(loan);
        db.Installments.Add(inst1);
        db.Installments.Add(inst2);
        await db.SaveChangesAsync();

        var service = new PaymentService(db, gateway.Object);
        await service.CreateAsync(new CreatePaymentDto { InstallmentId = inst2.Id, Amount = 100 });

        var updatedLoan = await db.Loans.FindAsync(loan.Id);
        Assert.Equal(LoanStatus.Closed, updatedLoan!.Status);
    }
}
