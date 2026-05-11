using ArchiCredit.Application.Interfaces;

namespace ArchiCredit.Infrastructure.ExternalServices;

/// <summary>
/// Mock payment gateway — succeeds 90% of the time to allow testing failure scenarios.
/// </summary>
public class MockPaymentGatewayService : IPaymentGatewayService
{
    private static readonly Random _rng = new();

    public Task<PaymentGatewayResult> ProcessAsync(decimal amount)
    {
        bool success = _rng.NextDouble() > 0.10;
        var transactionId = success
            ? $"TXN-{Guid.NewGuid():N}".ToUpper()[..20]
            : string.Empty;

        var result = new PaymentGatewayResult(
            IsSuccess: success,
            TransactionId: transactionId,
            ErrorMessage: success ? null : "Payment declined by gateway."
        );

        return Task.FromResult(result);
    }
}
