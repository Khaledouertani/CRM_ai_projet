namespace CrmApi.Models.Entities;

public class CrmAppointment
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientPhone { get; set; }
    public string? ClientEmail { get; set; }
    public string ProjectType { get; set; } = "PV";
    public DateTime AppointmentDate { get; set; }
    public string AppointmentTime { get; set; } = string.Empty;
    public int QualityScore { get; set; }
    public string FinancingStatus { get; set; } = "en_attente";
    public string Status { get; set; } = "pending";
    public float Revenus { get; set; }
    public string Chauffage { get; set; } = string.Empty;
    public string Toiture { get; set; } = string.Empty;
    public string Isolation { get; set; } = string.Empty;
    public float Consommation { get; set; }
    public int CreditScore { get; set; }
    public string SituationBancaire { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Agent { get; set; } = null!;
}
