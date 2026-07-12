using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Salary;

public class SalaryService : ISalaryService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public SalaryService(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<Models.Entities.Salary?> GetSalaryAsync(int id)
    {
        return await _context.Salaries
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<Models.Entities.Salary>> GetSalariesByAgentAsync(int agentId)
    {
        return await _context.Salaries
            .AsNoTracking()
            .Where(s => s.AgentId == agentId)
            .OrderByDescending(s => s.PaymentDate)
            .ToListAsync();
    }

    public async Task<bool> CreateSalaryAsync(int agentId, decimal amount, DateTime paymentDate)
    {
        var salary = new Models.Entities.Salary
        {
            AgentId = agentId,
            Amount = amount,
            PaymentDate = DateTime.SpecifyKind(paymentDate, DateTimeKind.Utc),
            Status = "Pending"
        };
        _context.Salaries.Add(salary);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateSalaryStatusAsync(int id, string status)
    {
        var salary = await _context.Salaries.FindAsync(id);
        if (salary == null) return false;
        salary.Status = status;
        _context.Salaries.Update(salary);
        await _context.SaveChangesAsync();
        return true;
    }
}
