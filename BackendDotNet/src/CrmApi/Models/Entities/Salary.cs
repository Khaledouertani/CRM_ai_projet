namespace CrmApi.Models.Entities;

public class Salary
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string Month { get; set; } = string.Empty;
    public float BaseSalary { get; set; }
    public int RdvCount { get; set; }
    public int PoseCount { get; set; }
    public int RefusCount { get; set; }
    public float QualityRate { get; set; }
    public float RdvBonus { get; set; }
    public float PoseBonus { get; set; }
    public float QualityBonus { get; set; }
    public float InstallationBonus { get; set; }
    public float Penalties { get; set; }
    public float TotalSalary { get; set; }
    public string PaymentStatus { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Agent { get; set; } = null!;
}
