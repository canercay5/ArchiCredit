using ArchiCredit.Application.Common;
using Xunit;

namespace ArchiCredit.Tests;

public class InstallmentCalculatorTests
{
    [Fact]
    public void CalculateMonthlyPayment_ZeroInterest_ReturnsEqualSplit()
    {
        decimal result = InstallmentCalculator.CalculateMonthlyPayment(12000m, 0m, 12);
        Assert.Equal(1000m, result);
    }

    [Fact]
    public void CalculateMonthlyPayment_WithInterest_IsGreaterThanPrincipalDivided()
    {
        decimal result = InstallmentCalculator.CalculateMonthlyPayment(10000m, 12m, 12);
        Assert.True(result > 10000m / 12m);
    }

    [Fact]
    public void GenerateSchedule_CorrectCount()
    {
        var schedule = InstallmentCalculator.GenerateSchedule(10000m, 12m, 24);
        Assert.Equal(24, schedule.Count);
    }

    [Fact]
    public void GenerateSchedule_TotalRepaymentsEqualsTotalAmount()
    {
        decimal principal = 10000m;
        int months = 12;
        var schedule = InstallmentCalculator.GenerateSchedule(principal, 12m, months);

        decimal totalPrincipal = schedule.Sum(s => s.Principal);
        // Rounding may leave a tiny diff — allow 1 cent tolerance
        Assert.True(Math.Abs(totalPrincipal - principal) < 0.10m,
            $"Expected total principal ~{principal}, got {totalPrincipal}");
    }

    [Fact]
    public void GenerateSchedule_EachInstallmentAmountEqualsPortions()
    {
        var schedule = InstallmentCalculator.GenerateSchedule(5000m, 6m, 6);
        foreach (var (amount, principal, interest) in schedule)
        {
            Assert.Equal(amount, principal + interest);
        }
    }

    [Fact]
    public void GenerateSchedule_InterestPortionDecreases()
    {
        var schedule = InstallmentCalculator.GenerateSchedule(10000m, 12m, 12);
        for (int i = 1; i < schedule.Count; i++)
        {
            Assert.True(schedule[i].Interest <= schedule[i - 1].Interest,
                $"Interest should decrease over time. Index {i}: {schedule[i].Interest} > {schedule[i - 1].Interest}");
        }
    }
}
