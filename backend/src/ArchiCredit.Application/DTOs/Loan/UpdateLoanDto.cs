using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.DTOs.Loan;

public class UpdateLoanDto
{
    public LoanStatus Status { get; set; }
}
