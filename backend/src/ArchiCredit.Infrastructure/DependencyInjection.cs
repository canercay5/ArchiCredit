using ArchiCredit.Application.Interfaces;
using ArchiCredit.Infrastructure.ExternalServices;
using ArchiCredit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchiCredit.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddScoped<ICreditScoreService, MockCreditScoreService>();
        services.AddScoped<IPaymentGatewayService, MockPaymentGatewayService>();

        return services;
    }
}
