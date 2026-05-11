using ArchiCredit.Application.DTOs.Customer;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class CreateCustomerValidator : AbstractValidator<CreateCustomerDto>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.NationalId)
            .NotEmpty()
            .Length(11)
            .Matches("^[0-9]+$").WithMessage("NationalId must contain only digits.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.Today.AddYears(-18)).WithMessage("Customer must be at least 18 years old.");
    }
}
