using ArchiCredit.Application.DTOs.Payment;
using ArchiCredit.Application.Interfaces;
using ArchiCredit.Domain.Entities;
using ArchiCredit.Domain.Enums;
using ArchiCredit.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Application.Services;

public class PaymentService(IAppDbContext db, IPaymentGatewayService gateway) : IPaymentService
{
    public async Task<IEnumerable<PaymentDto>> GetAllAsync()
    {
        return await db.Payments
            .Include(p => p.Installment)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<PaymentDto?> GetByInstallmentIdAsync(Guid installmentId)
    {
        var payment = await db.Payments
            .Include(p => p.Installment)
            .FirstOrDefaultAsync(p => p.InstallmentId == installmentId);
        return payment is null ? null : MapToDto(payment);
    }

    public async Task<PaymentDto> CreateAsync(CreatePaymentDto dto)
    {
        var installment = await db.Installments
            .Include(i => i.Payment)
            .Include(i => i.Loan)
            .FirstOrDefaultAsync(i => i.Id == dto.InstallmentId)
            ?? throw new NotFoundException(nameof(Installment), dto.InstallmentId);

        if (installment.Status == InstallmentStatus.Paid)
            throw new BusinessRuleException("This installment has already been paid.");

        if (installment.Payment is not null)
            throw new BusinessRuleException("A payment already exists for this installment.");

        var gatewayResult = await gateway.ProcessAsync(dto.Amount);

        var payment = new Payment
        {
            InstallmentId = dto.InstallmentId,
            Amount = dto.Amount,
            TransactionId = gatewayResult.TransactionId,
            Status = gatewayResult.IsSuccess ? PaymentStatus.Success : PaymentStatus.Failed
        };

        db.Payments.Add(payment);

        if (gatewayResult.IsSuccess)
        {
            installment.Status = InstallmentStatus.Paid;
            installment.PaidAt = DateTime.UtcNow;

            var allPaid = await db.Installments
                .Where(i => i.LoanId == installment.LoanId && i.Id != installment.Id)
                .AllAsync(i => i.Status == InstallmentStatus.Paid);

            if (allPaid)
                installment.Loan.Status = LoanStatus.Closed;
        }

        await db.SaveChangesAsync();
        return MapToDto(payment);
    }

    private static PaymentDto MapToDto(Payment p) => new()
    {
        Id = p.Id,
        InstallmentId = p.InstallmentId,
        InstallmentNumber = p.Installment?.InstallmentNumber ?? 0,
        LoanId = p.Installment?.LoanId ?? Guid.Empty,
        Amount = p.Amount,
        PaymentDate = p.PaymentDate,
        TransactionId = p.TransactionId,
        Status = p.Status,
        StatusName = p.Status.ToString()
    };
}
