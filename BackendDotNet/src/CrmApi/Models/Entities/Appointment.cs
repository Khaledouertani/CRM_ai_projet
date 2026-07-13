namespace CrmApi.Models.Entities;

public class Appointment
{
    public int Id { get; set; }
    public int CallId { get; set; }
    public string AgentIdRef { get; set; } = string.Empty;
    public string? DetectedDate { get; set; }
    public int ConfidenceScore { get; set; }
    public string Status { get; set; } = "detected";
    public DateTime? FinalDate { get; set; }
    public string? ClientName { get; set; }
    public string? ClientPhone { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Call Call { get; set; } = null!;
}
