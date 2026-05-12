using ArchiCredit.Application.Interfaces;

namespace ArchiCredit.Infrastructure.ExternalServices;

/// <summary>
/// Mock credit score service — deterministic score per NationalId using polynomial hash.
/// Distribution: ~85% pass (600–950), ~15% fail (500–599) to allow testing both paths.
/// </summary>
public class MockCreditScoreService : ICreditScoreService
{
    public Task<int> GetScoreAsync(string nationalId)
    {
        // Polynomial hash gives uniform distribution regardless of digit patterns
        int hash = nationalId.Aggregate(17, (acc, c) => unchecked(acc * 31 + c));
        var rng = new Random(Math.Abs(hash));

        // 85% approval band, 15% rejection band
        int score = rng.Next(100) < 15
            ? rng.Next(500, 600)
            : rng.Next(600, 951);

        return Task.FromResult(score);
    }
}
