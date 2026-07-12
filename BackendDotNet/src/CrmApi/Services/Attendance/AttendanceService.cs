using CrmApi.Models.Entities;
using CrmApi.Repositories;
using Microsoft.EntityFrameworkCore;
using CrmApi.Data;

namespace CrmApi.Services.Attendance;

public class AttendanceService : IAttendanceService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public AttendanceService(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<List<Models.Entities.Attendance>> GetAttendancesAsync(int agentId, DateTime? date)
    {
        var query = _context.Attendances.AsNoTracking();
        query = query.Where(a => a.AgentId == agentId);
        if (date.HasValue)
        {
            var targetDate = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.CheckInTime.Date == targetDate);
        }
        return await query.ToListAsync();
    }

    public async Task<Models.Entities.Attendance?> GetLatestAttendanceAsync(int agentId)
    {
        return await _context.Attendances
            .AsNoTracking()
            .Where(a => a.AgentId == agentId)
            .OrderByDescending(a => a.CheckInTime)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> CheckInAsync(int agentId)
    {
        var attendance = new Models.Entities.Attendance
        {
            AgentId = agentId,
            CheckInTime = DateTime.UtcNow,
            Status = "CheckedIn"
        };
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CheckOutAsync(int agentId)
    {
        var attendance = await _context.Attendances
            .Where(a => a.AgentId == agentId && a.CheckOutTime == null)
            .OrderByDescending(a => a.CheckInTime)
            .FirstOrDefaultAsync();
        if (attendance == null) return false;
        attendance.CheckOutTime = DateTime.UtcNow;
        _context.Attendances.Update(attendance);
        await _context.SaveChangesAsync();
        return true;
    }
}
