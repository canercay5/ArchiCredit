using System.Security.Claims;

namespace ArchiCredit.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static bool IsAdmin(this ClaimsPrincipal user)
        => user.IsInRole("Admin");

    public static Guid GetCustomerId(this ClaimsPrincipal user)
    {
        var val = user.FindFirstValue("customerId");
        return Guid.TryParse(val, out var id) ? id : Guid.Empty;
    }
}
