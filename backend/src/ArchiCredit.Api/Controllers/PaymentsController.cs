using ArchiCredit.Api.Extensions;
using ArchiCredit.Application.DTOs.Payment;
using ArchiCredit.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class PaymentsController(
    IPaymentService paymentService,
    IInstallmentService installmentService,
    ILoanService loanService,
    IValidator<CreatePaymentDto> createValidator) : ControllerBase
{
    [HttpGet("payments")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetAll()
        => Ok(await paymentService.GetAllAsync());

    [HttpGet("installments/{installmentId:guid}/payment")]
    public async Task<ActionResult<PaymentDto>> GetByInstallment(Guid installmentId)
    {
        var result = await paymentService.GetByInstallmentIdAsync(installmentId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost("payments")]
    public async Task<ActionResult<PaymentDto>> Create([FromBody] CreatePaymentDto dto)
    {
        var validation = await createValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => e.ErrorMessage));

        if (!User.IsAdmin())
        {
            var installment = await installmentService.GetByIdAsync(dto.InstallmentId);
            var loan = await loanService.GetByIdAsync(installment.LoanId);
            if (loan.CustomerId != User.GetCustomerId())
                return Forbid();
        }

        var result = await paymentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetByInstallment), new { installmentId = result.InstallmentId }, result);
    }
}
