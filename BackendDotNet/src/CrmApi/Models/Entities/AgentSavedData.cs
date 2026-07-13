namespace CrmApi.Models.Entities;

public class AgentSavedData
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string DataType { get; set; } = "session";
    public string? Payload { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Agent { get; set; } = null!;
}
