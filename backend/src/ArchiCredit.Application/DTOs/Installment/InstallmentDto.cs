using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.DTOs.Installment;

public class InstallmentDto
{
    public Guid Id { get; set; }
    public Guid LoanId { get; set; }
    public int InstallmentNumber { get; set; }
    public decimal Amount { get; set; }
    public decimal PrincipalPortion { get; set; }
    public decimal ProfitPortion { get; set; }
    public DateTime DueDate { get; set; }
    public InstallmentStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
}
