using ArchiCredit.Application.DTOs.Auth;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class RegisterCustomerValidator : AbstractValidator<RegisterCustomerDto>
{
    public RegisterCustomerValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.NationalId).NotEmpty().Length(11).Matches(@"^\d{11}$");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.PhoneNumber).MaximumLength(20);
        RuleFor(x => x.DateOfBirth).Must(d => DateTime.Today.AddYears(-18) >= d)
            .WithMessage("Customer must be at least 18 years old.");
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(100);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}
