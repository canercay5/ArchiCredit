using ArchiCredit.Application.DTOs.Installment;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Services;

public class InstallmentService(IAppDbContext db) : IInstallmentService
{
    public async Task<IEnumerable<InstallmentDto>> GetByLoanIdAsync(Guid loanId)
    {
        var exists = await db.Loans.AnyAsync(l => l.Id == loanId);
        if (!exists) throw new NotFoundException(nameof(Loan), loanId);

        await MarkOverdueAsync(loanId);

        return await db.Installments
            .Where(i => i.LoanId == loanId)
            .OrderBy(i => i.InstallmentNumber)
            .Select(i => MapToDto(i))
            .ToListAsync();
    }

    public async Task<InstallmentDto> GetByIdAsync(Guid id)
    {
        var installment = await db.Installments.FindAsync(id)
            ?? throw new NotFoundException(nameof(Installment), id);
        return MapToDto(installment);
    }

    public async Task UpdateOverdueStatusAsync()
    {
        var overdueItems = await db.Installments
            .Where(i => i.Status == InstallmentStatus.Unpaid && i.DueDate < DateTime.UtcNow)
            .ToListAsync();

        foreach (var item in overdueItems)
            item.Status = InstallmentStatus.Overdue;

        if (overdueItems.Count > 0)
            await db.SaveChangesAsync();
    }

    private async Task MarkOverdueAsync(Guid loanId)
    {
        var overdueItems = await db.Installments
            .Where(i => i.LoanId == loanId && i.Status == InstallmentStatus.Unpaid && i.DueDate < DateTime.UtcNow)
            .ToListAsync();

        foreach (var item in overdueItems)
            item.Status = InstallmentStatus.Overdue;

        if (overdueItems.Count > 0)
            await db.SaveChangesAsync();
    }

    private static InstallmentDto MapToDto(Installment i) => new()
    {
        Id = i.Id,
        LoanId = i.LoanId,
        InstallmentNumber = i.InstallmentNumber,
        Amount = i.Amount,
        PrincipalPortion = i.PrincipalPortion,
        ProfitPortion = i.ProfitPortion,
        DueDate = i.DueDate,
        Status = i.Status,
        StatusName = i.Status.ToString(),
        PaidAt = i.PaidAt
    };
}
