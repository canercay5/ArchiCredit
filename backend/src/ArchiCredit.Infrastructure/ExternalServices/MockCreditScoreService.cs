using ArchiCredit.Application.Interfaces;

namespace ArchiCredit.Infrastructure.ExternalServices;

/// <summary>
/// Mock credit score service — returns a deterministic but seemingly random score based on NationalId.
/// Scores below 600 trigger loan rejection to allow testing both paths.
/// </summary>
public class MockCreditScoreService : ICreditScoreService
{
    private static readonly Random _rng = new();

    public Task<int> GetScoreAsync(string nationalId)
    {
        // Seed with NationalId so the same customer always gets the same score in a session
        int seed = nationalId.Sum(c => c);
        var rng = new Random(seed);
        int score = rng.Next(550, 900);
        return Task.FromResult(score);
    }
}
