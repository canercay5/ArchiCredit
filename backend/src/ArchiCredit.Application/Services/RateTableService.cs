using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.Services;

// Kuveyt Türk katılım bankası tipik aylık kar payı oranları referans alınmıştır.
public class RateTableService : IProfitRateService
{
    // [termMonths threshold] = (Personal, Education, Vehicle)
    private static readonly (int MaxTerm, decimal Personal, decimal Education, decimal Vehicle)[] Tiers =
    [
        (3,   2.49m, 1.99m, 2.19m),
        (6,   2.59m, 2.09m, 2.29m),
        (12,  2.79m, 2.19m, 2.39m),
        (24,  2.99m, 2.29m, 2.49m),
        (36,  3.19m, 2.49m, 2.69m),
        (60,  3.39m, 2.69m, 2.89m),
        (120, 3.59m, 2.89m, 3.09m),
    ];

    public decimal GetMonthlyRate(LoanType loanType, int termMonths)
    {
        foreach (var (maxTerm, personal, education, vehicle) in Tiers)
        {
            if (termMonths <= maxTerm)
                return loanType switch
                {
                    LoanType.Personal  => personal,
                    LoanType.Education => education,
                    LoanType.Vehicle   => vehicle,
                    _                  => personal
                };
        }

        // Vade > 120 ay için son dilim + 0.1 puan ekle
        var last = Tiers[^1];
        return (loanType switch
        {
            LoanType.Personal  => last.Personal,
            LoanType.Education => last.Education,
            LoanType.Vehicle   => last.Vehicle,
            _                  => last.Personal
        }) + 0.1m;
    }
}
