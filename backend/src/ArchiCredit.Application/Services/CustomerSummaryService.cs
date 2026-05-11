using ArchiCredit.Application.DTOs.Installment;
using ArchiCredit.Application.DTOs.Summary;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Services;

public class CustomerSummaryService(IAppDbContext db) : ICustomerSummaryService
{
    public async Task<CustomerSummaryDto> GetSummaryAsync(Guid customerId)
    {
        var customer = await db.Customers.FindAsync(customerId)
            ?? throw new NotFoundException(nameof(Customer), customerId);

        // Mark overdue installments before summary
        var overdueItems = await db.Installments
            .Include(i => i.Loan)
            .Where(i => i.Loan.CustomerId == customerId
                     && i.Status == InstallmentStatus.Unpaid
                     && i.DueDate < DateTime.UtcNow)
            .ToListAsync();

        foreach (var item in overdueItems)
            item.Status = InstallmentStatus.Overdue;

        if (overdueItems.Count > 0)
            await db.SaveChangesAsync();

        var installments = await db.Installments
            .Include(i => i.Loan)
            .Where(i => i.Loan.CustomerId == customerId)
            .ToListAsync();

        var activeLoans = await db.Loans
            .Where(l => l.CustomerId == customerId && l.Status == LoanStatus.Active)
            .ToListAsync();

        decimal totalDebt = installments
            .Where(i => i.Status != InstallmentStatus.Paid)
            .Sum(i => i.Amount);

        decimal remainingPrincipal = installments
            .Where(i => i.Status != InstallmentStatus.Paid)
            .Sum(i => i.PrincipalPortion);

        var paid = installments.Where(i => i.Status == InstallmentStatus.Paid).ToList();
        var unpaid = installments.Where(i => i.Status != InstallmentStatus.Paid).ToList();

        return new CustomerSummaryDto
        {
            CustomerId = customerId,
            CustomerName = $"{customer.FirstName} {customer.LastName}",
            TotalLoanDebt = totalDebt,
            RemainingPrincipal = remainingPrincipal,
            OverdueInstallmentCount = installments.Count(i => i.Status == InstallmentStatus.Overdue),
            PaidInstallmentCount = paid.Count,
            UnpaidInstallmentCount = unpaid.Count,
            PaidInstallments = paid.Select(MapInstallment).ToList(),
            UnpaidInstallments = unpaid.Select(MapInstallment).ToList()
        };
    }

    private static InstallmentDto MapInstallment(Installment i) => new()
    {
        Id = i.Id,
        LoanId = i.LoanId,
        InstallmentNumber = i.InstallmentNumber,
        Amount = i.Amount,
        PrincipalPortion = i.PrincipalPortion,
        InterestPortion = i.InterestPortion,
        DueDate = i.DueDate,
        Status = i.Status,
        StatusName = i.Status.ToString(),
        PaidAt = i.PaidAt
    };
}
