using CrmApi.Models.Entities;
using CrmApi.Repositories;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Quality;

public class QualityDashboardService : IQualityDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;

    public QualityDashboardService(ApplicationDbContext context, IUnitOfWork uow)
    {
        _context = context;
        _uow = uow;
    }

    public async Task<double> GetAverageScoreAsync(int? agentId, DateTime? startDate, DateTime? endDate)
    {
        var query = _context.ManualEvaluations.AsNoTracking();
        if (agentId.HasValue)
            query = query.Where(e => e.AgentId == agentId.Value);
        if (startDate.HasValue && endDate.HasValue)
        {
            var start = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
            var end = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
            query = query.Where(e => e.CreatedAt >= start && e.CreatedAt <= end);
        }
        var scores = await query.Select(e => e.Score).ToListAsync();
        return scores.Count > 0 ? scores.Average() : 0;
    }

    public async Task<int> GetEvaluationCountAsync(int? agentId)
    {
        var query = _context.ManualEvaluations.AsNoTracking();
        if (agentId.HasValue)
            query = query.Where(e => e.AgentId == agentId.Value);
        return await query.CountAsync();
    }
}
