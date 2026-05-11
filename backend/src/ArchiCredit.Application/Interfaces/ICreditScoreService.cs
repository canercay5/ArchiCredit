namespace ArchiCredit.Application.Interfaces;

public interface ICreditScoreService
{
    Task<int> GetScoreAsync(string nationalId);
}
