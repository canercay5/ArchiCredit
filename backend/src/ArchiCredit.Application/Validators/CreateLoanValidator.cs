using ArchiCredit.Application.DTOs.Loan;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class CreateLoanValidator : AbstractValidator<CreateLoanDto>
{
    public CreateLoanValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.PrincipalAmount).GreaterThan(0).LessThanOrEqualTo(10_000_000);
        RuleFor(x => x.InterestRate).GreaterThanOrEqualTo(0).LessThanOrEqualTo(100);
        RuleFor(x => x.TermMonths).InclusiveBetween(1, 360);
        RuleFor(x => x.StartDate).GreaterThanOrEqualTo(DateTime.Today.AddDays(-1));
    }
}
