using ArchiCredit.Application.DTOs.Auth;
using FluentValidation;

namespace ArchiCredit.Application.Validators;

public class RegisterCustomerValidator : AbstractValidator<RegisterCustomerDto>
{
    public RegisterCustomerValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ad alanı zorunludur.")
            .MaximumLength(100).WithMessage("Ad 100 karakteri geçemez.");
        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Soyad alanı zorunludur.")
            .MaximumLength(100).WithMessage("Soyad 100 karakteri geçemez.");
        RuleFor(x => x.NationalId)
            .NotEmpty().WithMessage("TC kimlik numarası zorunludur.")
            .Length(11).WithMessage("TC kimlik numarası tam olarak 11 haneli olmalıdır.")
            .Matches(@"^\d{11}$").WithMessage("TC kimlik numarası yalnızca rakam içermelidir.");
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta alanı zorunludur.")
            .EmailAddress().WithMessage("Geçerli bir e-posta adresi giriniz.")
            .MaximumLength(200).WithMessage("E-posta 200 karakteri geçemez.");
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Telefon numarası 20 karakteri geçemez.");
        RuleFor(x => x.DateOfBirth)
            .Must(d => DateTime.Today.AddYears(-18) >= d)
            .WithMessage("18 yaşından küçükler kayıt olamaz.");
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Kullanıcı adı zorunludur.")
            .MinimumLength(3).WithMessage("Kullanıcı adı en az 3 karakter olmalıdır.")
            .MaximumLength(100).WithMessage("Kullanıcı adı 100 karakteri geçemez.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur.")
            .MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır.");
    }
}
