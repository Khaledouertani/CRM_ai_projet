using CrmApi.DTOs.Alert;

namespace CrmApi.Services.Alert;

public interface IAlertService
{
    Task<List<AlertRuleDto>> GetRulesAsync();
    Task<AlertRuleDto?> GetRuleByTypeAsync(string ruleType);
    Task<bool> CreateRuleAsync(CreateAlertRuleDto dto);
    Task<bool> UpdateRuleAsync(int ruleId, UpdateAlertRuleDto dto);
    Task<bool> DeleteRuleAsync(int ruleId);
    Task<List<AlertHistoryDto>> GetHistoryAsync(string? agentName, int limit);
    Task<AlertCheckResultDto> CheckAlertsAsync(string agentName, float? score, float? inactiveMinutes, float? conversionRate);
    Task<AlertCheckResultDto> CheckRealtimeAlertsAsync(string agentName);
    Task<bool> NotifyAlertAsync(Dictionary<string, object> alert);
}
