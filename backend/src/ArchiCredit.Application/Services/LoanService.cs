using ArchiCredit.Application.Common;
using ArchiCredit.Application.DTOs.Loan;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Services;

public class LoanService(IAppDbContext db, ICreditScoreService creditScoreService) : ILoanService
{
    public async Task<IEnumerable<LoanDto>> GetAllAsync()
    {
        return await db.Loans
            .Include(l => l.Customer)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => MapToDto(l))
            .ToListAsync();
    }

    public async Task<IEnumerable<LoanDto>> GetByCustomerIdAsync(Guid customerId)
    {
        var exists = await db.Customers.AnyAsync(c => c.Id == customerId);
        if (!exists) throw new NotFoundException(nameof(Customer), customerId);

        return await db.Loans
            .Include(l => l.Customer)
            .Where(l => l.CustomerId == customerId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => MapToDto(l))
            .ToListAsync();
    }

    public async Task<LoanDto> GetByIdAsync(Guid id)
    {
        var loan = await db.Loans
            .Include(l => l.Customer)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new NotFoundException(nameof(Loan), id);
        return MapToDto(loan);
    }

    public async Task<LoanDto> CreateAsync(CreateLoanDto dto)
    {
        var customer = await db.Customers.FindAsync(dto.CustomerId)
            ?? throw new NotFoundException(nameof(Customer), dto.CustomerId);

        var creditScore = await creditScoreService.GetScoreAsync(customer.NationalId);
        if (creditScore < 600)
            throw new BusinessRuleException($"Loan application rejected. Credit score {creditScore} is below the minimum threshold of 600.");

        var monthlyPayment = InstallmentCalculator.CalculateMonthlyPayment(
            dto.PrincipalAmount, dto.InterestRate, dto.TermMonths);

        var loan = new Loan
        {
            CustomerId = dto.CustomerId,
            LoanType = dto.LoanType,
            PrincipalAmount = dto.PrincipalAmount,
            InterestRate = dto.InterestRate,
            TermMonths = dto.TermMonths,
            StartDate = dto.StartDate,
            CreditScore = creditScore,
            MonthlyInstallmentAmount = monthlyPayment,
            TotalRepayment = monthlyPayment * dto.TermMonths
        };

        db.Loans.Add(loan);

        var schedule = InstallmentCalculator.GenerateSchedule(
            dto.PrincipalAmount, dto.InterestRate, dto.TermMonths);

        for (int i = 0; i < schedule.Count; i++)
        {
            var (amount, principal, interest) = schedule[i];
            db.Installments.Add(new Installment
            {
                LoanId = loan.Id,
                InstallmentNumber = i + 1,
                Amount = amount,
                PrincipalPortion = principal,
                InterestPortion = interest,
                DueDate = dto.StartDate.AddMonths(i + 1)
            });
        }

        await db.SaveChangesAsync();

        loan.Customer = customer;
        return MapToDto(loan);
    }

    public async Task<LoanDto> UpdateAsync(Guid id, UpdateLoanDto dto)
    {
        var loan = await db.Loans
            .Include(l => l.Customer)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new NotFoundException(nameof(Loan), id);

        loan.Status = dto.Status;
        await db.SaveChangesAsync();
        return MapToDto(loan);
    }

    private static LoanDto MapToDto(Loan l) => new()
    {
        Id = l.Id,
        CustomerId = l.CustomerId,
        CustomerName = l.Customer != null ? $"{l.Customer.FirstName} {l.Customer.LastName}" : string.Empty,
        LoanType = l.LoanType,
        LoanTypeName = l.LoanType.ToString(),
        PrincipalAmount = l.PrincipalAmount,
        InterestRate = l.InterestRate,
        TermMonths = l.TermMonths,
        StartDate = l.StartDate,
        Status = l.Status,
        StatusName = l.Status.ToString(),
        CreditScore = l.CreditScore,
        MonthlyInstallmentAmount = l.MonthlyInstallmentAmount,
        TotalRepayment = l.TotalRepayment,
        CreatedAt = l.CreatedAt
    };
}
