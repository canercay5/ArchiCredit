using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InstallmentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string TransactionId { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }

    public Installment Installment { get; set; } = null!;
}
