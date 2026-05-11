using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.DTOs.Loan;

public class LoanDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public LoanType LoanType { get; set; }
    public string LoanTypeName { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public decimal InterestRate { get; set; }
    public int TermMonths { get; set; }
    public DateTime StartDate { get; set; }
    public LoanStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int CreditScore { get; set; }
    public decimal MonthlyInstallmentAmount { get; set; }
    public decimal TotalRepayment { get; set; }
    public DateTime CreatedAt { get; set; }
}
