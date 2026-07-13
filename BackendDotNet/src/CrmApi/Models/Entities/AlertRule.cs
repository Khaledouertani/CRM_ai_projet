namespace CrmApi.Models.Entities;

public class AlertRule
{
    public int Id { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public int ThresholdValue { get; set; }
    public string? NotificationEmail { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
