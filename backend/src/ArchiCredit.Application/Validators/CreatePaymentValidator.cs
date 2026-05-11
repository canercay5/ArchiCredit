using ArchiCredit.Application.DTOs.Payment;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class CreatePaymentValidator : AbstractValidator<CreatePaymentDto>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.InstallmentId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}
