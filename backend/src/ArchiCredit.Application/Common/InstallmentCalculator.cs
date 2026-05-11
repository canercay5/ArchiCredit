namespace ArchiCredit.Application.Common;

public static class InstallmentCalculator
{
    /// <summary>
    /// Annuity (eşit taksit) formülü: A = P * (r*(1+r)^n) / ((1+r)^n - 1)
    /// </summary>
    public static decimal CalculateMonthlyPayment(decimal principal, decimal annualInterestRate, int termMonths)
    {
        if (annualInterestRate == 0)
            return Math.Round(principal / termMonths, 2);

        decimal r = annualInterestRate / 100m / 12m;
        decimal factor = (decimal)Math.Pow((double)(1 + r), termMonths);
        return Math.Round(principal * (r * factor) / (factor - 1), 2);
    }

    public static List<(decimal Amount, decimal Principal, decimal Interest)> GenerateSchedule(
        decimal principal, decimal annualInterestRate, int termMonths)
    {
        var schedule = new List<(decimal, decimal, decimal)>();
        decimal monthlyRate = annualInterestRate / 100m / 12m;
        decimal monthlyPayment = CalculateMonthlyPayment(principal, annualInterestRate, termMonths);
        decimal remainingPrincipal = principal;

        for (int i = 0; i < termMonths; i++)
        {
            decimal interest = Math.Round(remainingPrincipal * monthlyRate, 2);
            decimal principalPortion = monthlyPayment - interest;

            // Last installment: adjust for rounding differences
            if (i == termMonths - 1)
                principalPortion = remainingPrincipal;

            decimal amount = principalPortion + interest;
            remainingPrincipal -= principalPortion;
            schedule.Add((amount, principalPortion, interest));
        }

        return schedule;
    }
}
