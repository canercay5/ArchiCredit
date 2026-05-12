using ArchiCredit.Application.DTOs.Auth;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Kullanıcı adı zorunludur.");
        RuleFor(x => x.NationalId)
            .NotEmpty().WithMessage("TC kimlik numarası zorunludur.")
            .Length(11).WithMessage("TC kimlik numarası tam olarak 11 haneli olmalıdır.")
            .Matches(@"^\d{11}$").WithMessage("TC kimlik numarası yalnızca rakam içermelidir.");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Şifre zorunludur.")
            .MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır.");
    }
}
