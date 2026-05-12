using ArchiCredit.Application.Common;
using ArchiCredit.Application.DTOs.Loan;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Services;

public class LoanService(
    IAppDbContext db,
    ICreditScoreService creditScoreService,
    IProfitRateService profitRateService) : ILoanService
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

    public async Task<LoanDto> CreateAsync(CreateLoanDto dto, Guid requestingCustomerId)
    {
        if (dto.CustomerId != requestingCustomerId)
            throw new BusinessRuleException("You can only submit loan applications for your own account.");

        var customer = await db.Customers.FindAsync(dto.CustomerId)
            ?? throw new NotFoundException(nameof(Customer), dto.CustomerId);

        var suggestedRate = profitRateService.GetMonthlyRate(dto.LoanType, dto.TermMonths);

        var loan = new Loan
        {
            CustomerId = dto.CustomerId,
            LoanType = dto.LoanType,
            PrincipalAmount = dto.PrincipalAmount,
            MonthlyProfitRate = suggestedRate,
            TermMonths = dto.TermMonths,
            StartDate = dto.StartDate,
            Status = LoanStatus.Pending
        };

        db.Loans.Add(loan);
        await db.SaveChangesAsync();

        loan.Customer = customer;
        return MapToDto(loan);
    }

    public async Task<LoanDto> ApproveAsync(Guid id, ApproveLoanDto dto)
    {
        var loan = await db.Loans
            .Include(l => l.Customer)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new NotFoundException(nameof(Loan), id);

        if (loan.Status != LoanStatus.Pending)
            throw new BusinessRuleException($"Only pending loans can be approved. Current status: {loan.Status}");

        var customer = loan.Customer;
        var creditScore = await creditScoreService.GetScoreAsync(customer.NationalId);
        if (creditScore < 600)
            throw new BusinessRuleException($"Loan application rejected. Credit score {creditScore} is below the minimum threshold of 600.");

        var profitRate = dto.OverrideProfitRate ?? loan.MonthlyProfitRate;
        var monthlyPayment = InstallmentCalculator.CalculateMonthlyPayment(
            loan.PrincipalAmount, profitRate, loan.TermMonths);

        loan.MonthlyProfitRate = profitRate;
        loan.CreditScore = creditScore;
        loan.MonthlyInstallmentAmount = monthlyPayment;
        loan.TotalRepayment = monthlyPayment * loan.TermMonths;
        loan.Status = LoanStatus.Active;
        loan.ApprovedAt = DateTime.UtcNow;

        var schedule = InstallmentCalculator.GenerateSchedule(
            loan.PrincipalAmount, profitRate, loan.TermMonths);

        for (int i = 0; i < schedule.Count; i++)
        {
            var (amount, principal, profit) = schedule[i];
            db.Installments.Add(new Installment
            {
                LoanId = loan.Id,
                InstallmentNumber = i + 1,
                Amount = amount,
                PrincipalPortion = principal,
                ProfitPortion = profit,
                DueDate = loan.StartDate.AddMonths(i + 1)
            });
        }

        await db.SaveChangesAsync();
        return MapToDto(loan);
    }

    public async Task<LoanDto> RejectAsync(Guid id, RejectLoanDto dto)
    {
        var loan = await db.Loans
            .Include(l => l.Customer)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new NotFoundException(nameof(Loan), id);

        if (loan.Status != LoanStatus.Pending)
            throw new BusinessRuleException($"Only pending loans can be rejected. Current status: {loan.Status}");

        loan.Status = LoanStatus.Rejected;
        loan.RejectedAt = DateTime.UtcNow;
        loan.RejectionReason = dto.Reason;

        await db.SaveChangesAsync();
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
        MonthlyProfitRate = l.MonthlyProfitRate,
        TermMonths = l.TermMonths,
        StartDate = l.StartDate,
        Status = l.Status,
        StatusName = l.Status.ToString(),
        CreditScore = l.CreditScore,
        MonthlyInstallmentAmount = l.MonthlyInstallmentAmount,
        TotalRepayment = l.TotalRepayment,
        CreatedAt = l.CreatedAt,
        ApprovedAt = l.ApprovedAt,
        RejectedAt = l.RejectedAt,
        RejectionReason = l.RejectionReason
    };
}
