namespace ArchiCredit.Application.DTOs.Payment;

public class CreatePaymentDto
{
    public Guid InstallmentId { get; set; }
    public decimal Amount { get; set; }
}
