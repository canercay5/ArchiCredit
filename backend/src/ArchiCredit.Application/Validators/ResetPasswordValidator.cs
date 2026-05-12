using ArchiCredit.Application.DTOs.Auth;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.NationalId).NotEmpty().Length(11).Matches(@"^\d{11}$");
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6);
    }
}
