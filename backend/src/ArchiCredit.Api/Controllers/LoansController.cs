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
        => Ok(await loanService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LoanDto>> GetById(Guid id)
        => Ok(await loanService.GetByIdAsync(id));

    [HttpPost]
    public async Task<ActionResult<LoanDto>> Create([FromBody] CreateLoanDto dto)
    {
        var validation = await createValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(validation.Errors.Select(e => e.ErrorMessage));

        var result = await loanService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LoanDto>> Update(Guid id, [FromBody] UpdateLoanDto dto)
        => Ok(await loanService.UpdateAsync(id, dto));
}
