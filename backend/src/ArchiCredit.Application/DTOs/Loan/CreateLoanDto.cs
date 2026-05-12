using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.DTOs.Loan;

public class CreateLoanDto
{
    public Guid CustomerId { get; set; }
    public LoanType LoanType { get; set; }
    public decimal PrincipalAmount { get; set; }
    public int TermMonths { get; set; }
    public DateTime StartDate { get; set; }
}
