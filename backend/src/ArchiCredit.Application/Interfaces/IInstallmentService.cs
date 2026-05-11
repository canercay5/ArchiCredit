using ArchiCredit.Application.DTOs.Installment;

namespace ArchiCredit.Application.Interfaces;

public interface IInstallmentService
{
    Task<IEnumerable<InstallmentDto>> GetByLoanIdAsync(Guid loanId);
    Task<InstallmentDto> GetByIdAsync(Guid id);
    Task UpdateOverdueStatusAsync();
}
