using ArchiCredit.Domain.Enums;

namespace ArchiCredit.Application.Interfaces;

public interface IProfitRateService
{
    decimal GetMonthlyRate(LoanType loanType, int termMonths);
}
