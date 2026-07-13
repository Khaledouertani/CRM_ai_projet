namespace CrmApi.Models.Entities;

public class Agent
{
    public int Id { get; set; }
    public string AgentId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime? FirstCall { get; set; }
    public DateTime? LastCall { get; set; }
    public int TotalCalls { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
