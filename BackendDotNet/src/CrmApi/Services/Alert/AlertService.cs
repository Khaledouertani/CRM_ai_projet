using CrmApi.Data;
using CrmApi.DTOs.Alert;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Alert;

public class AlertService : IAlertService
{
    private readonly ApplicationDbContext _context;

    public AlertService(ApplicationDbContext context) => _context = context;

    public async Task<List<AlertRuleDto>> GetRulesAsync()
    {
        return await _context.AlertRules.AsNoTracking().Select(r => new AlertRuleDto { Id = r.Id, RuleType = r.RuleType, ThresholdValue = r.ThresholdValue, NotificationEmail = r.NotificationEmail, IsActive = r.IsActive }).ToListAsync();
    }

    public async Task<AlertRuleDto?> GetRuleByTypeAsync(string ruleType)
    {
        var rule = await _context.AlertRules.AsNoTracking().FirstOrDefaultAsync(r => r.RuleType == ruleType && r.IsActive);
        if (rule == null) return null;
        return new AlertRuleDto { Id = rule.Id, RuleType = rule.RuleType, ThresholdValue = rule.ThresholdValue, NotificationEmail = rule.NotificationEmail, IsActive = rule.IsActive };
    }

    public async Task<bool> CreateRuleAsync(CreateAlertRuleDto dto)
    {
        _context.AlertRules.Add(new Models.Entities.AlertRule { RuleType = dto.RuleType, ThresholdValue = dto.ThresholdValue, NotificationEmail = dto.NotificationEmail });
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateRuleAsync(int ruleId, UpdateAlertRuleDto dto)
    {
        var rule = await _context.AlertRules.FindAsync(ruleId);
        if (rule == null) return false;
        if (dto.ThresholdValue.HasValue) rule.ThresholdValue = dto.ThresholdValue.Value;
        if (dto.IsActive.HasValue) rule.IsActive = dto.IsActive.Value;
        _context.AlertRules.Update(rule);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRuleAsync(int ruleId)
    {
        var rule = await _context.AlertRules.FindAsync(ruleId);
        if (rule == null) return false;
        _context.AlertRules.Remove(rule);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<AlertHistoryDto>> GetHistoryAsync(string? agentName, int limit)
    {
        var query = _context.AlertHistories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(agentName)) query = query.Where(h => h.AgentName == agentName);
        return await query.OrderByDescending(h => h.CreatedAt).Take(limit).Select(h => new AlertHistoryDto { Id = h.Id, AgentName = h.AgentName, AlertType = h.AlertType, Severity = h.Severity, Message = h.Message, ThresholdValue = h.ThresholdValue, ActualValue = h.ActualValue, CreatedAt = h.CreatedAt }).ToListAsync();
    }

    public async Task<AlertCheckResultDto> CheckAlertsAsync(string agentName, float? score, float? inactiveMinutes, float? conversionRate)
    {
        var alerts = new List<AlertItemDto>();
        var rules = await _context.AlertRules.AsNoTracking().Where(r => r.IsActive).ToListAsync();

        if (score.HasValue) { var rule = rules.FirstOrDefault(r => r.RuleType == "low_score"); if (rule != null && score.Value < rule.ThresholdValue) { alerts.Add(new AlertItemDto { AlertType = "low_score", Severity = "warning", Message = $"Score {score.Value} below threshold {rule.ThresholdValue}", ThresholdValue = rule.ThresholdValue, ActualValue = score.Value }); } }
        if (inactiveMinutes.HasValue) { var rule = rules.FirstOrDefault(r => r.RuleType == "inactivity"); if (rule != null && inactiveMinutes.Value > rule.ThresholdValue) { alerts.Add(new AlertItemDto { AlertType = "inactivity", Severity = "error", Message = $"Inactivity {inactiveMinutes.Value}min exceeds threshold {rule.ThresholdValue}min", ThresholdValue = rule.ThresholdValue, ActualValue = inactiveMinutes.Value }); } }
        if (conversionRate.HasValue) { var rule = rules.FirstOrDefault(r => r.RuleType == "conversion"); if (rule != null && conversionRate.Value < rule.ThresholdValue) { alerts.Add(new AlertItemDto { AlertType = "conversion", Severity = "warning", Message = $"Conversion rate {conversionRate.Value}% below threshold {rule.ThresholdValue}%", ThresholdValue = rule.ThresholdValue, ActualValue = conversionRate.Value }); } }

        foreach (var alert in alerts) { _context.AlertHistories.Add(new Models.Entities.AlertHistory { AgentName = agentName, AlertType = alert.AlertType, Severity = alert.Severity, Message = alert.Message, ThresholdValue = alert.ThresholdValue, ActualValue = alert.ActualValue }); }
        if (alerts.Count > 0) await _context.SaveChangesAsync();

        return new AlertCheckResultDto { Alerts = alerts, Count = alerts.Count };
    }

    public async Task<AlertCheckResultDto> CheckRealtimeAlertsAsync(string agentName)
    {
        var today = DateTime.UtcNow.Date;
        var calls = await _context.Calls.AsNoTracking().Where(c => c.AgentName == agentName && c.CallDate.HasValue && c.CallDate!.Value.Date == today).ToListAsync();
        var rule = await _context.AlertRules.AsNoTracking().FirstOrDefaultAsync(r => r.RuleType == "low_score" && r.IsActive);
        var alerts = new List<AlertItemDto>();
        if (rule != null) { foreach (var call in calls.Where(c => c.ScorePercentage < rule.ThresholdValue)) { alerts.Add(new AlertItemDto { AlertType = "low_score", Severity = "warning", Message = $"Call {call.Id}: score {call.ScorePercentage} below {rule.ThresholdValue}", ThresholdValue = rule.ThresholdValue, ActualValue = call.ScorePercentage }); } }
        return new AlertCheckResultDto { Alerts = alerts, Count = alerts.Count };
    }

    public async Task<bool> NotifyAlertAsync(Dictionary<string, object> alert) { Console.WriteLine($"[Alert] {System.Text.Json.JsonSerializer.Serialize(alert)}"); return await Task.FromResult(true); }
}
