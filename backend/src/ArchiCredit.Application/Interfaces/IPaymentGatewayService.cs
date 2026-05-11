namespace ArchiCredit.Application.Interfaces;

public record PaymentGatewayResult(bool IsSuccess, string TransactionId, string? ErrorMessage);

public interface IPaymentGatewayService
{
    Task<PaymentGatewayResult> ProcessAsync(decimal amount);
}
