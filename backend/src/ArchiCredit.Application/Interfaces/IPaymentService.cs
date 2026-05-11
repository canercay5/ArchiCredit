using ArchiCredit.Application.DTOs.Payment;

namespace ArchiCredit.Application.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<PaymentDto>> GetAllAsync();
    Task<PaymentDto?> GetByInstallmentIdAsync(Guid installmentId);
    Task<PaymentDto> CreateAsync(CreatePaymentDto dto);
}
