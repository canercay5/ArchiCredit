using ArchiCredit.Application.DTOs.Customer;

namespace ArchiCredit.Application.Interfaces;

public interface ICustomerService
{
    Task<IEnumerable<CustomerDto>> GetAllAsync();
    Task<CustomerDto> GetByIdAsync(Guid id);
    Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerDto dto);
    Task<CustomerDto> UpdateProfileAsync(Guid id, UpdateCustomerProfileDto dto);
    Task DeleteAsync(Guid id);
}
