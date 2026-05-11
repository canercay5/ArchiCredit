using ArchiCredit.Application.DTOs.Summary;

namespace ArchiCredit.Application.Interfaces;

public interface ICustomerSummaryService
{
    Task<CustomerSummaryDto> GetSummaryAsync(Guid customerId);
}
