using ArchiCredit.Application.DTOs.Payment;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class CreatePaymentValidator : AbstractValidator<CreatePaymentDto>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.InstallmentId)
            .NotEmpty().WithMessage("Taksit ID zorunludur.");
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Ödeme tutarı 0'dan büyük olmalıdır.");
    }
}
