using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Lead;

public class LeadService : ILeadService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public LeadService(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<List<Models.Entities.Lead>> GetLeadsAsync(int? agentId, string? status)
    {
        var query = _context.Leads.AsNoTracking();
        if (agentId.HasValue)
            query = query.Where(l => l.AgentId == agentId.Value);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(l => l.Status == status);
        return await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
    }

    public async Task<Models.Entities.Lead?> GetLeadByIdAsync(int id)
    {
        return await _context.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<bool> CreateLeadAsync(int agentId, string name, string phone, string email)
    {
        var lead = new Models.Entities.Lead
        {
            AgentId = agentId,
            Name = name,
            Phone = phone,
            Email = email,
            Status = "New"
        };
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateLeadStatusAsync(int id, string status)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return false;
        lead.Status = status;
        _context.Leads.Update(lead);
        await _context.SaveChangesAsync();
        return true;
    }
}
