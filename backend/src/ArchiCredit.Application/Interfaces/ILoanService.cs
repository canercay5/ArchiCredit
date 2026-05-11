using ArchiCredit.Application.DTOs.Loan;

namespace ArchiCredit.Application.Interfaces;

public interface ILoanService
{
    Task<IEnumerable<LoanDto>> GetAllAsync();
    Task<IEnumerable<LoanDto>> GetByCustomerIdAsync(Guid customerId);
    Task<LoanDto> GetByIdAsync(Guid id);
    Task<LoanDto> CreateAsync(CreateLoanDto dto);
    Task<LoanDto> UpdateAsync(Guid id, UpdateLoanDto dto);
}
