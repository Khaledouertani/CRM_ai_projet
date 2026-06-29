using CrmApi.DTOs.Supplier;

namespace CrmApi.Services.Supplier;

public interface ISupplierService
{
    Task<List<SupplierDto>> GetSuppliersAsync();
    Task<SupplierDto?> GetSupplierByIdAsync(int id);
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto);
    Task<bool> UpdateSupplierAsync(int id, UpdateSupplierDto dto);
    Task<bool> DeleteSupplierAsync(int id);
}
