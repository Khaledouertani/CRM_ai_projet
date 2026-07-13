namespace CrmApi.Models.Entities;

public class AlertHistory
{
    public int Id { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = "warning";
    public string? Message { get; set; }
    public int ThresholdValue { get; set; }
    public float ActualValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
