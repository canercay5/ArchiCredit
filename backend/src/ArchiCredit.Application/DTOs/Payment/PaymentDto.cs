using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.DTOs.Payment;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid InstallmentId { get; set; }
    public int InstallmentNumber { get; set; }
    public Guid LoanId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
}
