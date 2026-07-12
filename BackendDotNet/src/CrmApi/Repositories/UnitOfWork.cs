using CrmApi.Models.Entities;

namespace CrmApi.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context) => _context = context;

    public IRepository<User> Users => new Repository<User>(_context);
    public IRepository<Agent> Agents => new Repository<Agent>(_context);
    public IRepository<Call> Calls => new Repository<Call>(_context);
    public IRepository<Appointment> Appointments => new Repository<Appointment>(_context);
    public IRepository<CrmAppointment> CrmAppointments => new Repository<CrmAppointment>(_context);
    public IRepository<Followup> Followups => new Repository<Followup>(_context);
    public IRepository<Log> Logs => new Repository<Log>(_context);
    public IRepository<Message> Messages => new Repository<Message>(_context);
    public IRepository<ManualEvaluation> ManualEvaluations => new Repository<ManualEvaluation>(_context);
    public IRepository<Attendance> Attendances => new Repository<Attendance>(_context);
    public IRepository<AttendanceBreak> AttendanceBreaks => new Repository<AttendanceBreak>(_context);
    public IRepository<SalaryRule> SalaryRules => new Repository<SalaryRule>(_context);
    public IRepository<Salary> Salaries => new Repository<Salary>(_context);
    public IRepository<AgentSavedData> AgentSavedData => new Repository<AgentSavedData>(_context);
    public IRepository<AiEligibilityLog> AiEligibilityLogs => new Repository<AiEligibilityLog>(_context);
    public IRepository<AlertRule> AlertRules => new Repository<AlertRule>(_context);
    public IRepository<AlertHistory> AlertHistories => new Repository<AlertHistory>(_context);
    public IRepository<Lead> Leads => new Repository<Lead>(_context);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context?.Dispose();
}
