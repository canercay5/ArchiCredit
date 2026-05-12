using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api/profit-rates")]
public class ProfitRatesController(IProfitRateService profitRateService) : ControllerBase
{
    [HttpGet]
    public ActionResult<decimal> GetRate([FromQuery] LoanType loanType, [FromQuery] int termMonths)
        => Ok(new { monthlyRate = profitRateService.GetMonthlyRate(loanType, termMonths) });
}
