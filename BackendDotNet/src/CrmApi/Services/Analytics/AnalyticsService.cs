using CrmApi.Data;
using CrmApi.DTOs.Analytics;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;

    public AnalyticsService(ApplicationDbContext context) => _context = context;

    public async Task<OverviewDto> GetOverviewAsync()
    {
        var calls = await _context.Calls.AsNoTracking().ToListAsync();
        var today = DateTime.UtcNow.Date;
        var callsToday = calls.Count(c => c.CallDate.HasValue && c.CallDate.Value.Date == today);

        return new OverviewDto
        {
            TotalCalls = calls.Count,
            AvgScore = calls.Count > 0 ? Math.Round(calls.Average(c => c.ScorePercentage), 2) : 0,
            Sentiments = calls.GroupBy(c => c.Sentiment ?? "NEUTRAL").ToDictionary(g => g.Key, g => g.Count()),
            Performances = calls.GroupBy(c => c.Performance ?? "N/A").ToDictionary(g => g.Key, g => g.Count()),
            BestAgent = calls.GroupBy(c => c.AgentName).OrderByDescending(g => g.Average(c => c.ScorePercentage)).FirstOrDefault()?.Key,
            WorstAgent = calls.GroupBy(c => c.AgentName).OrderBy(g => g.Average(c => c.ScorePercentage)).FirstOrDefault()?.Key,
            Hourly = calls.Where(c => c.CallDate.HasValue).GroupBy(c => c.CallDate!.Value.Hour).Select(g => new HourlyDataDto { Hour = g.Key, Appels = g.Count() }).OrderBy(h => h.Hour).ToList(),
            Radar = new List<RadarDataDto>
            {
                new() { Critere = "Ecoute", Score = calls.Count > 0 ? calls.Average(c => c.ScoreEcoute) : 0 },
                new() { Critere = "Persuasion", Score = calls.Count > 0 ? calls.Average(c => c.ScorePersuasion) : 0 },
                new() { Critere = "Empathie", Score = calls.Count > 0 ? calls.Average(c => c.ScoreEmpathie) : 0 },
                new() { Critere = "Argumentation", Score = calls.Count > 0 ? calls.Average(c => c.ScoreArgumentation) : 0 },
                new() { Critere = "Refus", Score = calls.Count > 0 ? calls.Average(c => c.ScoreRefus) : 0 },
                new() { Critere = "Vente", Score = calls.Count > 0 ? calls.Average(c => c.ScoreVente) : 0 }
            },
            CallsToday = callsToday,
            ActiveAgents = calls.Where(c => c.CallDate.HasValue && c.CallDate.Value.Date == today).Select(c => c.AgentName).Distinct().Count(),
            ConversionRate = 0,
            PendingFollowups = 0,
            AvgDuration = 0
        };
    }

    public async Task<List<AgentPerformanceDto>> GetAgentsPerformanceAsync()
    {
        var calls = await _context.Calls.AsNoTracking().ToListAsync();
        return calls.GroupBy(c => c.AgentName).Select(g => new AgentPerformanceDto
        {
            AgentName = g.Key,
            TotalCalls = g.Count(),
            AvgScore = Math.Round(g.Average(c => c.ScorePercentage), 2),
            Positive = g.Count(c => c.Sentiment == "POSITIVE"),
            Negative = g.Count(c => c.Sentiment == "NEGATIVE"),
            Neutral = g.Count(c => c.Sentiment == "NEUTRAL"),
            TalkRatio = Math.Round(g.Average(c => c.AgentTalkRatio), 3),
            ClientRatio = Math.Round(g.Average(c => c.ClientTalkRatio), 3)
        }).ToList();
    }

    public async Task<SupervisionDto> GetSupervisionAsync()
    {
        var calls = await _context.Calls.AsNoTracking().ToListAsync();
        return new SupervisionDto
        {
            Refusals = calls.Where(c => !string.IsNullOrEmpty(c.RefusalReason)).GroupBy(c => c.RefusalReason!).Select(g => new RefusalDto { Motif = g.Key, Count = g.Count() }).ToList(),
            RefusalsByAgent = calls.Where(c => !string.IsNullOrEmpty(c.RefusalReason)).GroupBy(c => c.AgentName).Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() }).ToList(),
            IncoherenceCount = calls.Count(c => c.QualificationMatch == false),
            CoherenceAvg = calls.Where(c => c.CoherenceScore.HasValue).Count() > 0 ? Math.Round(calls.Where(c => c.CoherenceScore.HasValue).Average(c => c.CoherenceScore!.Value), 2) : 0,
            IncoherencesByAgent = calls.Where(c => c.QualificationMatch == false).GroupBy(c => c.AgentName).Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() }).ToList(),
            InactivityCount = calls.Count(c => c.InactivityDetected)
        };
    }

    public async Task<GeoDto> GetGeoAsync()
    {
        var calls = await _context.Calls.AsNoTracking().Where(c => !string.IsNullOrEmpty(c.PostalCode)).ToListAsync();
        var depts = calls.GroupBy(c => c.PostalCode!.Length >= 2 ? c.PostalCode!.Substring(0, 2) : c.PostalCode!).Select(g => new DeptDto { Dept = g.Key, Total = g.Count(), AvgScore = Math.Round(g.Average(c => c.ScorePercentage), 2) }).OrderByDescending(d => d.Total).ToList();
        return new GeoDto { Departments = depts, TotalLocalized = calls.Count, DeptCount = depts.Count, TopDept = depts.FirstOrDefault()?.Dept };
    }

    public async Task<FollowupStatsDto> GetFollowupsAsync()
    {
        var followups = await _context.Followups.AsNoTracking().ToListAsync();
        return new FollowupStatsDto
        {
            Stats = new FollowupSummaryDto
            {
                Total = followups.Count,
                ARelancer = followups.Count(f => f.Status == "a_relancer"),
                RelanceEnCours = followups.Count(f => f.Status == "relance_en_cours"),
                Convertis = followups.Count(f => f.Status == "converti"),
                TauxConversion = followups.Count > 0 ? Math.Round((double)followups.Count(f => f.Status == "converti") / followups.Count * 100, 2) : 0
            },
            ByStatus = followups.GroupBy(f => f.Status ?? "unknown").Select(g => new StatusCountDto { Status = g.Key, Count = g.Count() }).ToList(),
            ByAgent = followups.GroupBy(f => f.AgentName).Select(g => new AgentRefusalDto { Agent = g.Key, Count = g.Count() }).ToList()
        };
    }

    public async Task<List<CallsLogDto>> GetCallsLogAsync(int limit)
    {
        return await _context.Calls.AsNoTracking().OrderByDescending(c => c.CallDate).Take(limit).Select(c => new CallsLogDto
        {
            CallId = c.Id,
            AgentName = c.AgentName,
            CallDate = c.CallDate,
            Sentiment = c.Sentiment,
            ScorePercentage = c.ScorePercentage,
            Performance = c.Performance,
            CustomerIntent = c.CustomerIntent,
            InactivityDetected = c.InactivityDetected,
            DiarizationMethod = c.DiarizationMethod
        }).ToListAsync();
    }

    public async Task<List<object>> GetPointageAsync()
    {
        var today = DateTime.UtcNow.Date;
        var calls = await _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue && c.CallDate.Value.Date == today).ToListAsync();
        return calls.GroupBy(c => c.AgentName).Select(g => (object)new { agent = g.Key, first_call = g.Min(c => c.CallDate), last_call = g.Max(c => c.CallDate), total_calls = g.Count(), productive_time = (g.Max(c => c.CallDate) - g.Min(c => c.CallDate))?.TotalMinutes ?? 0, status = "online" }).ToList();
    }

    public async Task<List<object>> GetLiveAgentsAsync()
    {
        var users = await _context.Users.AsNoTracking().Where(u => u.Role == Models.Entities.UserRole.Agent).ToListAsync();
        return users.Select(u => (object)new { id = u.Id, name = u.Name, status = "online", calls = 0, idleTime = 0, score = 0, breakType = "" }).ToList();
    }

    public async Task<ComparisonDto> GetComparisonAsync()
    {
        var now = DateTime.UtcNow;
        var thisMonth = new DateTime(now.Year, now.Month, 1);
        var lastMonth = thisMonth.AddMonths(-1);
        var calls = await _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue).ToListAsync();

        var thisMonthCalls = calls.Where(c => c.CallDate!.Value >= thisMonth).ToList();
        var lastMonthCalls = calls.Where(c => c.CallDate!.Value >= lastMonth && c.CallDate!.Value < thisMonth).ToList();

        double CalcTotal(List<Models.Entities.Call> list) => list.Count;
       double CalcAvg(List<Models.Entities.Call> list) =>
    list.Count > 0
        ? Math.Round(list.Average(c => (double)c.ScorePercentage), 2)
        : 0;
        double CalcEvolution(double current, double previous) =>
            previous != 0 ? Math.Round(((current - previous) / previous) * 100, 2) : 0;

        var dayCalls = calls.Where(c => c.CallDate!.Value.Date == now.Date).ToList();
        var weekCalls = calls.Where(c => c.CallDate!.Value >= now.AddDays(-7)).ToList();

        var dayAvg = CalcAvg(dayCalls);
        var weekAvg = CalcAvg(weekCalls);
        var monthAvg = CalcAvg(thisMonthCalls);
        var lastMonthAvg = CalcAvg(lastMonthCalls);

        return new ComparisonDto
        {
            Day = new ComparisonPeriodDto
            {
                Total = (int)CalcTotal(dayCalls),
                AvgScore = dayAvg,
                Evolution = 0,
                ScoreEvol = 0
            },
            Week = new ComparisonPeriodDto
            {
                Total = (int)CalcTotal(weekCalls),
                AvgScore = weekAvg,
                Evolution = 0,
                ScoreEvol = 0
            },
            Month = new ComparisonPeriodDto
            {
                Total = thisMonthCalls.Count,
                AvgScore = monthAvg,
                Previous = lastMonthCalls.Count,
                PreviousScore = lastMonthAvg,
                Evolution = CalcEvolution(monthAvg, lastMonthAvg),
                ScoreEvol = CalcEvolution(monthAvg, lastMonthAvg)
            }
        };
    }
}
