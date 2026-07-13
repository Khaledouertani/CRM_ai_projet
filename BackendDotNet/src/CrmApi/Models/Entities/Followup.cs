namespace CrmApi.Models.Entities;

public class Followup
{
    public int Id { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public DateTime? AppointmentDate { get; set; }
    public string? Status { get; set; }
    public int RelanceCount { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
