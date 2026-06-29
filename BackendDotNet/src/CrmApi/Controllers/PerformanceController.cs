using CrmApi.Data;
using CrmApi.DTOs.Agent;
using CrmApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/performance")]
public class PerformanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PerformanceController(ApplicationDbContext context) => _context = context;

    [HttpGet("comparison")]
    [Authorize]
    public async Task<IActionResult> GetComparison([FromQuery] string? month, [FromQuery] int? agentId, [FromQuery] string? agentName)
    {
        try
        {
            var now = DateTime.UtcNow;
            var currentMonth = month ?? now.ToString("yyyy-MM");
            var calls = await _context.Calls.AsNoTracking().Where(c => c.CallDate.HasValue).ToListAsync();
            var thisMonthCalls = calls.Where(c => c.CallDate!.Value.ToString("yyyy-MM") == currentMonth).ToList();
            var lastMonth = DateTime.ParseExact(currentMonth, "yyyy-MM", null).AddMonths(-1).ToString("yyyy-MM");
            var lastMonthCalls = calls.Where(c => c.CallDate!.Value.ToString("yyyy-MM") == lastMonth).ToList();

            return Ok(new PerformanceComparisonDto
            {
                CurrentMonth = new PerformanceDataDto { TotalCalls = thisMonthCalls.Count, AvgScore = thisMonthCalls.Count > 0 ? Math.Round(thisMonthCalls.Average(c => c.ScorePercentage), 2) : 0, Conversions = 0, Refusals = thisMonthCalls.Count(c => c.Sentiment == "NEGATIVE"), RefusalRate = thisMonthCalls.Count > 0 ? Math.Round((double)thisMonthCalls.Count(c => c.Sentiment == "NEGATIVE") / thisMonthCalls.Count * 100, 2) : 0, AvgDuration = 0 },
                PreviousMonth = new PerformanceDataDto { TotalCalls = lastMonthCalls.Count, AvgScore = lastMonthCalls.Count > 0 ? Math.Round(lastMonthCalls.Average(c => c.ScorePercentage), 2) : 0, Conversions = 0, Refusals = lastMonthCalls.Count(c => c.Sentiment == "NEGATIVE"), RefusalRate = lastMonthCalls.Count > 0 ? Math.Round((double)lastMonthCalls.Count(c => c.Sentiment == "NEGATIVE") / lastMonthCalls.Count * 100, 2) : 0, AvgDuration = 0 },
                Evolution = new PerformanceEvolutionDto()
            });
        }
        catch (FormatException) { return BadRequest(new { error = "Invalid month format. Expected yyyy-MM" }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents([FromQuery] string? month)
    {
        try { return Ok(new List<object>()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("agents-from-calls")]
    public async Task<IActionResult> GetAgentsFromCalls()
    {
        try
        {
            var result = await _context.Calls.AsNoTracking().GroupBy(c => new { c.AgentId, c.AgentName }).Select(g => new { id = g.Key.AgentId, name = g.Key.AgentName, total_calls = g.Count(), avg_score = Math.Round(g.Average(c => c.ScorePercentage), 2) }).ToListAsync();
            return Ok(result);
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
