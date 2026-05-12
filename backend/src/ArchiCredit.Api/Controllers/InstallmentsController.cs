using ArchiCredit.Api.Extensions;
using ArchiCredit.Application.DTOs.Installment;
using ArchiCredit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class InstallmentsController(
    IInstallmentService installmentService,
    ILoanService loanService) : ControllerBase
{
    [HttpGet("loans/{loanId:guid}/installments")]
    public async Task<ActionResult<IEnumerable<InstallmentDto>>> GetByLoan(Guid loanId)
    {
        if (!User.IsAdmin())
        {
            var loan = await loanService.GetByIdAsync(loanId);
            if (loan.CustomerId != User.GetCustomerId())
                return Forbid();
        }

        return Ok(await installmentService.GetByLoanIdAsync(loanId));
    }

    [HttpGet("installments/{id:guid}")]
    public async Task<ActionResult<InstallmentDto>> GetById(Guid id)
        => Ok(await installmentService.GetByIdAsync(id));
}
