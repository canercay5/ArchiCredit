namespace ArchiCredit.Application.Common;

public static class InstallmentCalculator
{
    // Anüite formülü: A = P * (r*(1+r)^n) / ((1+r)^n - 1)
    // r: aylık kar payı oranı (% / 100)
    public static decimal CalculateMonthlyPayment(decimal principal, decimal monthlyProfitRate, int termMonths)
    {
        if (monthlyProfitRate == 0)
            return Math.Round(principal / termMonths, 2);

        decimal r = monthlyProfitRate / 100m;
        decimal factor = (decimal)Math.Pow((double)(1 + r), termMonths);
        return Math.Round(principal * (r * factor) / (factor - 1), 2);
    }

    public static List<(decimal Amount, decimal Principal, decimal Profit)> GenerateSchedule(
        decimal principal, decimal monthlyProfitRate, int termMonths)
    {
        var schedule = new List<(decimal, decimal, decimal)>();
        decimal r = monthlyProfitRate / 100m;
        decimal monthlyPayment = CalculateMonthlyPayment(principal, monthlyProfitRate, termMonths);
        decimal remainingPrincipal = principal;

        for (int i = 0; i < termMonths; i++)
        {
            decimal profit = Math.Round(remainingPrincipal * r, 2);
            decimal principalPortion = monthlyPayment - profit;

            if (i == termMonths - 1)
                principalPortion = remainingPrincipal;

            decimal amount = principalPortion + profit;
            remainingPrincipal -= principalPortion;
            schedule.Add((amount, principalPortion, profit));
        }

        return schedule;
    }
}
