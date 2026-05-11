using ArchiCredit.Application.Interfaces;
using ArchiCredit.Application.Services;
using ArchiCredit.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace ArchiCredit.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ILoanService, LoanService>();
        services.AddScoped<IInstallmentService, InstallmentService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<ICustomerSummaryService, CustomerSummaryService>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddValidatorsFromAssemblyContaining<CreateCustomerValidator>();

        return services;
    }
}
