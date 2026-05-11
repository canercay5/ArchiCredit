using System.Text.Json;
using ArchiCredit.Domain.Exceptions;
using ValidationException = ArchiCredit.Domain.Exceptions.ValidationException;

namespace ArchiCredit.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await HandleAsync(ctx, ex);
        }
    }

    private static Task HandleAsync(HttpContext ctx, Exception ex)
    {
        ctx.Response.ContentType = "application/problem+json";

        var (status, title, errors) = ex switch
        {
            NotFoundException e => (StatusCodes.Status404NotFound, e.Message, (object?)null),
            BusinessRuleException e => (StatusCodes.Status422UnprocessableEntity, e.Message, (object?)null),
            ValidationException e => (StatusCodes.Status400BadRequest, "Validation failed.", (object?)e.Errors),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", (object?)null)
        };

        ctx.Response.StatusCode = status;

        var body = new Dictionary<string, object?>
        {
            ["type"] = $"https://httpstatuses.io/{status}",
            ["title"] = title,
            ["status"] = status
        };
        if (errors is not null) body["errors"] = errors;

        return ctx.Response.WriteAsync(JsonSerializer.Serialize(body));
    }
}
