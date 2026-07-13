namespace CrmApi.Models.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Agent;
    public string Email { get; set; } = string.Empty;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
    public ICollection<CrmAppointment> CrmAppointments { get; set; } = new List<CrmAppointment>();
    public ICollection<Salary> Salaries { get; set; } = new List<Salary>();
    public ICollection<ManualEvaluation> ReceivedEvaluations { get; set; } = new List<ManualEvaluation>();
    public ICollection<ManualEvaluation> GivenEvaluations { get; set; } = new List<ManualEvaluation>();
    public ICollection<AgentSavedData> SavedData { get; set; } = new List<AgentSavedData>();
}
