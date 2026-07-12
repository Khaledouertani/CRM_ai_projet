using CrmApi.Models.Entities;

namespace CrmApi.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Agent> Agents { get; }
    IRepository<Call> Calls { get; }
    IRepository<Appointment> Appointments { get; }
    IRepository<CrmAppointment> CrmAppointments { get; }
    IRepository<Followup> Followups { get; }
    IRepository<Log> Logs { get; }
    IRepository<Message> Messages { get; }
    IRepository<ManualEvaluation> ManualEvaluations { get; }
    IRepository<Attendance> Attendances { get; }
    IRepository<AttendanceBreak> AttendanceBreaks { get; }
    IRepository<SalaryRule> SalaryRules { get; }
    IRepository<Salary> Salaries { get; }
    IRepository<AgentSavedData> AgentSavedData { get; }
    IRepository<AiEligibilityLog> AiEligibilityLogs { get; }
    IRepository<AlertRule> AlertRules { get; }
    IRepository<AlertHistory> AlertHistories { get; }
    IRepository<Lead> Leads { get; }
    Task<int> SaveChangesAsync();
}
