using ArchiCredit.Api.Extensions;
using ArchiCredit.Application.DTOs.Customer;
using ArchiCredit.Application.DTOs.Summary;
using ArchiCredit.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiCredit.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController(
    ICustomerService customerService,
    ICustomerSummaryService summaryService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
        => Ok(await customerService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> GetById(Guid id)
    {
        if (!User.IsAdmin() && User.GetCustomerId() != id)
            return Forbid();

        return Ok(await customerService.GetByIdAsync(id));
    }

[HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CustomerDto>> Update(Guid id, [FromBody] UpdateCustomerDto dto)
        => Ok(await customerService.UpdateAsync(id, dto));

    [HttpPut("{id:guid}/profile")]
    public async Task<ActionResult<CustomerDto>> UpdateProfile(Guid id, [FromBody] UpdateCustomerProfileDto dto)
    {
        if (!User.IsAdmin() && User.GetCustomerId() != id)
            return Forbid();

        return Ok(await customerService.UpdateProfileAsync(id, dto));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await customerService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<CustomerSummaryDto>> GetSummary(Guid id)
    {
        if (!User.IsAdmin() && User.GetCustomerId() != id)
            return Forbid();

        return Ok(await summaryService.GetSummaryAsync(id));
    }

    [HttpGet("{customerId:guid}/loans")]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetLoans(
        Guid customerId,
        [FromServices] ILoanService loanService)
    {
        if (!User.IsAdmin() && User.GetCustomerId() != customerId)
            return Forbid();

        return Ok(await loanService.GetByCustomerIdAsync(customerId));
    }
}
