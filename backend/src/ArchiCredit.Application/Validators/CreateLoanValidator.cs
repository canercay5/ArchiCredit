using ArchiCredit.Application.DTOs.Loan;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class CreateLoanValidator : AbstractValidator<CreateLoanDto>
{
    public CreateLoanValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Müşteri ID zorunludur.");
        RuleFor(x => x.PrincipalAmount)
            .GreaterThan(0).WithMessage("Tutar 0'dan büyük olmalıdır.")
            .LessThanOrEqualTo(10_000_000).WithMessage("Tutar 10.000.000 ₺'yi geçemez.");
        RuleFor(x => x.TermMonths)
            .InclusiveBetween(1, 360).WithMessage("Vade 1 ile 360 ay arasında olmalıdır.");
        RuleFor(x => x.StartDate)
            .GreaterThanOrEqualTo(DateTime.Today.AddDays(-1))
            .WithMessage("Başlangıç tarihi geçmiş bir tarih olamaz.");
    }
}
