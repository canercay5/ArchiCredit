using ArchiCredit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api/external")]
[Authorize]
public class ExternalController(
    ICreditScoreService creditScoreService,
    IPaymentGatewayService paymentGatewayService) : ControllerBase
{
    [HttpGet("credit-score/{nationalId}")]
    public async Task<ActionResult<object>> GetCreditScore(string nationalId)
    {
        var score = await creditScoreService.GetScoreAsync(nationalId);
        return Ok(new { nationalId, creditScore = score, retrievedAt = DateTime.UtcNow });
    }

    [HttpPost("process-payment")]
    public async Task<ActionResult<object>> ProcessPayment([FromBody] ProcessPaymentRequest request)
    {
        var result = await paymentGatewayService.ProcessAsync(request.Amount);
        return Ok(new
        {
            isSuccess = result.IsSuccess,
            transactionId = result.TransactionId,
            errorMessage = result.ErrorMessage
        });
    }
}

public record ProcessPaymentRequest(decimal Amount);
