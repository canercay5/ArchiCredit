using ArchiCredit.Application.DTOs.Installment;

namespace ArchiCredit.Application.DTOs.Summary;

public class CustomerSummaryDto
{
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalLoanDebt { get; set; }
    public decimal RemainingPrincipal { get; set; }
    public int OverdueInstallmentCount { get; set; }
    public int PaidInstallmentCount { get; set; }
    public int UnpaidInstallmentCount { get; set; }
    public List<InstallmentDto> PaidInstallments { get; set; } = new();
    public List<InstallmentDto> UnpaidInstallments { get; set; } = new();
}
