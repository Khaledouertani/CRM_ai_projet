namespace CrmApi.Models.Entities;

public class LeadFolder
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Campaign { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
