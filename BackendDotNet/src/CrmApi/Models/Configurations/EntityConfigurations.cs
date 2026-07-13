using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmApi.Models.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Password).HasMaxLength(255).IsRequired();
        builder.Property(u => u.Name).HasMaxLength(150).IsRequired();
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        builder.Property(u => u.Email).HasMaxLength(150);
        builder.Property(u => u.ResetToken).HasMaxLength(255);
        builder.HasIndex(u => u.Username).IsUnique();
        builder.HasIndex(u => u.Email);
        builder.HasMany(u => u.SentMessages).WithOne(m => m.Sender).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(u => u.ReceivedMessages).WithOne(m => m.Receiver).HasForeignKey(m => m.ReceiverId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(u => u.CrmAppointments).WithOne(a => a.Agent).HasForeignKey(a => a.AgentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(u => u.Salaries).WithOne(s => s.Agent).HasForeignKey(s => s.AgentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(u => u.ReceivedEvaluations).WithOne(e => e.Agent).HasForeignKey(e => e.AgentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(u => u.GivenEvaluations).WithOne(e => e.Evaluator).HasForeignKey(e => e.EvaluatorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(u => u.SavedData).WithOne(d => d.Agent).HasForeignKey(d => d.AgentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(u => u.Attendances).WithOne(a => a.User).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class AgentConfiguration : IEntityTypeConfiguration<Agent>
{
    public void Configure(EntityTypeBuilder<Agent> builder)
    {
        builder.ToTable("agents");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.AgentId).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Name).HasMaxLength(150).IsRequired();
        builder.Property(a => a.Email).HasMaxLength(120);
        builder.HasIndex(a => a.AgentId).IsUnique();
    }
}

public class CallConfiguration : IEntityTypeConfiguration<Call>
{
    public void Configure(EntityTypeBuilder<Call> builder)
    {
        builder.ToTable("calls");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.AgentId).HasMaxLength(50).IsRequired();
        builder.Property(c => c.AgentName).HasMaxLength(150).IsRequired();
        builder.Property(c => c.AudioFile).HasMaxLength(500);
        builder.Property(c => c.Sentiment).HasMaxLength(20);
        builder.Property(c => c.Performance).HasMaxLength(50);
        builder.Property(c => c.CallType).HasMaxLength(50);
        builder.Property(c => c.Problem).HasMaxLength(200);
        builder.Property(c => c.PostalCode).HasMaxLength(10);
        builder.Property(c => c.CustomerIntent).HasMaxLength(100);
        builder.Property(c => c.AppointmentDate).HasMaxLength(100);
        builder.Property(c => c.DiarizationMethod).HasMaxLength(20).HasDefaultValue("none");
        builder.Property(c => c.RefusalReason).HasMaxLength(200);
        builder.Property(c => c.Qualification).HasMaxLength(100);
        builder.Property(c => c.Keywords).HasColumnType("jsonb");
        builder.Property(c => c.AgentPoliteness).HasDefaultValue(5);
        builder.HasIndex(c => c.AgentId);
        builder.HasIndex(c => c.CallDate);
    }
}

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("appointments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.AgentIdRef).HasMaxLength(50).IsRequired();
        builder.Property(a => a.DetectedDate).HasMaxLength(100);
        builder.Property(a => a.Status).HasMaxLength(20).HasDefaultValue("detected");
        builder.Property(a => a.ClientName).HasMaxLength(100);
        builder.Property(a => a.ClientPhone).HasMaxLength(20);
        builder.HasOne(a => a.Call).WithMany().HasForeignKey(a => a.CallId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class CrmAppointmentConfiguration : IEntityTypeConfiguration<CrmAppointment>
{
    public void Configure(EntityTypeBuilder<CrmAppointment> builder)
    {
        builder.ToTable("crm_appointments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ClientName).HasMaxLength(150).IsRequired();
        builder.Property(a => a.ClientPhone).HasMaxLength(30);
        builder.Property(a => a.ClientEmail).HasMaxLength(150);
        builder.Property(a => a.ProjectType).HasMaxLength(50).HasDefaultValue("PV");
        builder.Property(a => a.AppointmentTime).HasMaxLength(10).IsRequired();
        builder.Property(a => a.FinancingStatus).HasMaxLength(50).HasDefaultValue("en_attente");
        builder.Property(a => a.Status).HasMaxLength(30).HasDefaultValue("pending");
        builder.Property(a => a.Chauffage).HasMaxLength(50);
        builder.Property(a => a.Toiture).HasMaxLength(50);
        builder.Property(a => a.Isolation).HasMaxLength(50);
        builder.Property(a => a.SituationBancaire).HasMaxLength(50);
        builder.HasOne(a => a.Agent).WithMany(u => u.CrmAppointments).HasForeignKey(a => a.AgentId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.ToTable("attendance");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Status).HasMaxLength(20).HasDefaultValue("active");
        builder.HasIndex(a => new { a.UserId, a.Date }).HasDatabaseName("idx_user_date");
        builder.HasIndex(a => a.Status).HasDatabaseName("idx_status");
        builder.HasMany(a => a.Breaks).WithOne(b => b.Attendance).HasForeignKey(b => b.AttendanceId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class AttendanceBreakConfiguration : IEntityTypeConfiguration<AttendanceBreak>
{
    public void Configure(EntityTypeBuilder<AttendanceBreak> builder)
    {
        builder.ToTable("attendance_breaks");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Type).HasMaxLength(50).IsRequired();
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("messages");
        builder.HasKey(m => m.Id);
        builder.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Receiver).WithMany(u => u.ReceivedMessages).HasForeignKey(m => m.ReceiverId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class SalaryRuleConfiguration : IEntityTypeConfiguration<SalaryRule>
{
    public void Configure(EntityTypeBuilder<SalaryRule> builder)
    {
        builder.ToTable("salary_rules");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.RuleName).HasMaxLength(100).IsRequired();
        builder.Property(r => r.RuleType).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Role).HasMaxLength(50).HasDefaultValue("agent");
    }
}

public class SalaryConfiguration : IEntityTypeConfiguration<Salary>
{
    public void Configure(EntityTypeBuilder<Salary> builder)
    {
        builder.ToTable("salaries");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Month).HasMaxLength(7).IsRequired();
        builder.Property(s => s.PaymentStatus).HasMaxLength(20).HasDefaultValue("pending");
        builder.HasOne(s => s.Agent).WithMany(u => u.Salaries).HasForeignKey(s => s.AgentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(s => new { s.AgentId, s.Month }).IsUnique().HasDatabaseName("unique_agent_month");
    }
}

public class ManualEvaluationConfiguration : IEntityTypeConfiguration<ManualEvaluation>
{
    public void Configure(EntityTypeBuilder<ManualEvaluation> builder)
    {
        builder.ToTable("manual_evaluations");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.CallRef).HasMaxLength(100);
        builder.Property(e => e.Decision).HasMaxLength(50);
        builder.HasOne(e => e.Agent).WithMany(u => u.ReceivedEvaluations).HasForeignKey(e => e.AgentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Evaluator).WithMany(u => u.GivenEvaluations).HasForeignKey(e => e.EvaluatorId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class AlertRuleConfiguration : IEntityTypeConfiguration<AlertRule>
{
    public void Configure(EntityTypeBuilder<AlertRule> builder)
    {
        builder.ToTable("alert_rules");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.RuleType).HasMaxLength(50);
    }
}

public class AlertHistoryConfiguration : IEntityTypeConfiguration<AlertHistory>
{
    public void Configure(EntityTypeBuilder<AlertHistory> builder)
    {
        builder.ToTable("alert_history");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Severity).HasMaxLength(20).HasDefaultValue("warning");
    }
}

public class AgentSavedDataConfiguration : IEntityTypeConfiguration<AgentSavedData>
{
    public void Configure(EntityTypeBuilder<AgentSavedData> builder)
    {
        builder.ToTable("agent_saved_data");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.DataType).HasMaxLength(50).HasDefaultValue("session");
        builder.Property(d => d.Payload).HasColumnType("jsonb");
    }
}

public class AiEligibilityLogConfiguration : IEntityTypeConfiguration<AiEligibilityLog>
{
    public void Configure(EntityTypeBuilder<AiEligibilityLog> builder)
    {
        builder.ToTable("ai_eligibility_logs");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ClientData).HasColumnType("jsonb");
        builder.Property(a => a.Result).HasColumnType("jsonb");
    }
}

public class LogConfiguration : IEntityTypeConfiguration<Log>
{
    public void Configure(EntityTypeBuilder<Log> builder)
    {
        builder.ToTable("logs");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.UserId).HasMaxLength(50);
        builder.Property(l => l.Action).HasMaxLength(100);
    }
}

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.ToTable("leads");
        builder.HasKey(l => l.Id);
    }
}

public class FollowupConfiguration : IEntityTypeConfiguration<Followup>
{
    public void Configure(EntityTypeBuilder<Followup> builder)
    {
        builder.ToTable("followups");
        builder.HasKey(f => f.Id);
    }
}

public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.ToTable("campaigns");
        builder.HasKey(c => c.Id);
    }
}
