using ArchiCredit.Application.Common;
using Xunit;

namespace ArchiCredit.Tests;

public class InstallmentCalculatorTests
{
    [Fact]
    public void CalculateMonthlyPayment_ZeroProfitRate_ReturnsEqualSplit()
    {
        decimal result = InstallmentCalculator.CalculateMonthlyPayment(12000m, 0m, 12);
        Assert.Equal(1000m, result);
    }

    [Fact]
    public void CalculateMonthlyPayment_WithProfitRate_IsGreaterThanPrincipalDivided()
    {
        // %2.79 aylık kar payı oranı
        decimal result = InstallmentCalculator.CalculateMonthlyPayment(10000m, 2.79m, 12);
        Assert.True(result > 10000m / 12m);
    }

    [Fact]
    public void GenerateSchedule_CorrectCount()
    {
        var schedule = InstallmentCalculator.GenerateSchedule(10000m, 2.79m, 24);
        Assert.Equal(24, schedule.Count);
    }

    [Fact]
    public void GenerateSchedule_TotalPrincipalEqualsLoanAmount()
    {
        decimal principal = 10000m;
        int months = 12;
        var schedule = InstallmentCalculator.GenerateSchedule(principal, 2.79m, months);

        decimal totalPrincipal = schedule.Sum(s => s.Principal);
        Assert.True(Math.Abs(totalPrincipal - principal) < 0.10m,
            $"Expected total principal ~{principal}, got {totalPrincipal}");
    }

    [Fact]
    public void GenerateSchedule_EachInstallmentAmountEqualsPortions()
    {
        var schedule = InstallmentCalculator.GenerateSchedule(5000m, 2.49m, 6);
        foreach (var (amount, principal, profit) in schedule)
        {
            Assert.Equal(amount, principal + profit);
        }
    }

    [Fact]
    public void GenerateSchedule_ProfitPortionDecreases()
    {
        var schedule = InstallmentCalculator.GenerateSchedule(10000m, 2.79m, 12);
        for (int i = 1; i < schedule.Count; i++)
        {
            Assert.True(schedule[i].Profit <= schedule[i - 1].Profit,
                $"Profit portion should decrease over time. Index {i}: {schedule[i].Profit} > {schedule[i - 1].Profit}");
        }
    }
}
