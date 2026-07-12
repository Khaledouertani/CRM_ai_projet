using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Call;

public class CallService : ICallService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public CallService(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<List<Models.Entities.Call>> GetCallsAsync(int? agentId, DateTime? date)
    {
        var query = _context.Calls.AsNoTracking();
        if (agentId.HasValue)
            query = query.Where(c => c.AgentId == agentId.Value);
        if (date.HasValue)
        {
            var targetDate = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
            query = query.Where(c => c.CallDate.Date == targetDate);
        }
        return await query.OrderByDescending(c => c.CallDate).ToListAsync();
    }

    public async Task<Models.Entities.Call?> GetCallByIdAsync(int id)
    {
        return await _context.Calls
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> CreateCallAsync(int agentId, string phoneNumber, string callType)
    {
        var call = new Models.Entities.Call
        {
            AgentId = agentId,
            PhoneNumber = phoneNumber,
            CallType = callType,
            CallDate = DateTime.UtcNow,
            Duration = 0
        };
        _context.Calls.Add(call);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EndCallAsync(int callId, int duration)
    {
        var call = await _context.Calls.FindAsync(callId);
        if (call == null) return false;
        call.Duration = duration;
        call.EndTime = DateTime.UtcNow;
        _context.Calls.Update(call);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetTotalCallsAsync(int agentId)
    {
        return await _context.Calls
            .AsNoTracking()
            .CountAsync(c => c.AgentId == agentId);
    }

    public async Task<int> GetCallsForDateAsync(int agentId, DateTime date)
    {
        var targetDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        return await _context.Calls
            .AsNoTracking()
            .CountAsync(c => c.AgentId == agentId && c.CallDate.Date == targetDate);
    }

    public async Task<double> GetAverageDurationAsync(int agentId)
    {
        var calls = await _context.Calls
            .AsNoTracking()
            .Where(c => c.AgentId == agentId && c.Duration > 0)
            .ToListAsync();
        return calls.Count > 0 ? calls.Average(c => c.Duration) : 0;
    }
}
