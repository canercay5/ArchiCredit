using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Domain.Entities;

public class Loan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public LoanType LoanType { get; set; }
    public decimal PrincipalAmount { get; set; }
    public decimal MonthlyProfitRate { get; set; }
    public int TermMonths { get; set; }
    public DateTime StartDate { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Pending;
    public int CreditScore { get; set; }
    public decimal MonthlyInstallmentAmount { get; set; }
    public decimal TotalRepayment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectionReason { get; set; }

    public Customer Customer { get; set; } = null!;
    public ICollection<Installment> Installments { get; set; } = new List<Installment>();
}
