using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Domain.Entities;

public class Installment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LoanId { get; set; }
    public int InstallmentNumber { get; set; }
    public decimal Amount { get; set; }
    public decimal PrincipalPortion { get; set; }
    public decimal ProfitPortion { get; set; }
    public DateTime DueDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Unpaid;
    public DateTime? PaidAt { get; set; }

    public Loan Loan { get; set; } = null!;
    public Payment? Payment { get; set; }
}
