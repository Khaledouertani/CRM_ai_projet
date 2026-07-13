namespace CrmApi.Models.Entities;

public class AiEligibilityLog
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string? ClientData { get; set; }
    public string? Result { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
