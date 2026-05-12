using ArchiCredit.Api.Extensions;
using ArchiCredit.Application.DTOs.Loan;
using ArchiCredit.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api/loans")]
[Authorize]
public class LoansController(
    ILoanService loanService,
    IValidator<CreateLoanDto> createValidator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LoanDto>>> GetAll()
    {
        if (User.IsAdmin())
            return Ok(await loanService.GetAllAsync());

        var customerId = User.GetCustomerId();
        if (customerId == Guid.Empty)
            return Forbid();

        return Ok(await loanService.GetByCustomerIdAsync(customerId));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LoanDto>> GetById(Guid id)
    {
        var loan = await loanService.GetByIdAsync(id);

        if (!User.IsAdmin() && loan.CustomerId != User.GetCustomerId())
            return Forbid();

        return Ok(loan);
    }

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<LoanDto>> Create([FromBody] CreateLoanDto dto)
    {
        var validation = await createValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => e.ErrorMessage));

        var customerId = User.GetCustomerId();
        var result = await loanService.CreateAsync(dto, customerId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LoanDto>> Approve(Guid id, [FromBody] ApproveLoanDto dto)
        => Ok(await loanService.ApproveAsync(id, dto));

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LoanDto>> Reject(Guid id, [FromBody] RejectLoanDto dto)
        => Ok(await loanService.RejectAsync(id, dto));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LoanDto>> Update(Guid id, [FromBody] UpdateLoanDto dto)
        => Ok(await loanService.UpdateAsync(id, dto));
}
