using CrmApi.Data;
using CrmApi.DTOs.Agent;
using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CrmApi.Services.Agent;

public class AgentServiceImpl : IAgentService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public AgentServiceImpl(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<List<AgentSimpleDto>> GetAgentsAsync()
    {
        var users = await _uow.Users.FindAsync(u => u.Role == UserRole.Agent);
        return users.Select(u => new AgentSimpleDto { AgentId = u.Id, AgentName = u.Name }).ToList();
    }

    public async Task<AgentPerformanceDetailDto> GetAgentPerformanceAsync(string agentId)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(u => u.Id.ToString() == agentId) ?? throw new KeyNotFoundException("Agent not found");
        return new AgentPerformanceDetailDto
        {
            AgentId = user.Id,
            AgentName = user.Name,
            CurrentMonth = new PerformancePeriodDto(),
            PreviousMonth = new PerformancePeriodDto()
        };
    }

    public async Task<(bool success, string message, int agentId)> SaveAgentDataAsync(int userId, AgentSaveDto dto)
    {
        var existing = await _context.AgentSavedData.FirstOrDefaultAsync(d => d.AgentId == userId);
        var payload = JsonSerializer.Serialize(dto);
        if (existing != null)
        {
            existing.Payload = payload;
            existing.UpdatedAt = DateTime.UtcNow;
            _context.AgentSavedData.Update(existing);
        }
        else
        {
            var entity = new Models.Entities.AgentSavedData { AgentId = userId, DataType = "session", Payload = payload };
            _context.AgentSavedData.Add(entity);
        }
        await _context.SaveChangesAsync();
        return (true, "Data saved", userId);
    }

    public async Task<AgentSaveDto> GetSavedDataAsync(int userId)
    {
        var data = await _context.AgentSavedData.FirstOrDefaultAsync(d => d.AgentId == userId);
        if (data?.Payload == null) return new AgentSaveDto();
        return JsonSerializer.Deserialize<AgentSaveDto>(data.Payload) ?? new AgentSaveDto();
    }
}
