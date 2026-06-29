using CrmApi.Helpers;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Data;

public class DatabaseSeedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;

    public DatabaseSeedService(IServiceProvider serviceProvider) => _serviceProvider = serviceProvider;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await context.Database.MigrateAsync(cancellationToken);

        if (!await context.Users.AnyAsync(u => u.Username == "admin", cancellationToken))
        {
            context.Users.Add(new User
            {
                Username = "admin",
                Password = PasswordHasher.HashPassword("admin"),
                Name = "Administrator",
                Role = UserRole.Admin,
                Email = "admin@crm.local"
            });
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.SalaryRules.AnyAsync(cancellationToken))
        {
            var defaultRules = new List<SalaryRule>
            {
                new() { RuleName = "Salaire de base", RuleType = "base_salary", Amount = 1500, Role = "agent" },
                new() { RuleName = "Prime RDV", RuleType = "rdv_bonus", Amount = 50, Role = "agent" },
                new() { RuleName = "Prime pose", RuleType = "pose_bonus", Amount = 150, Role = "agent" },
                new() { RuleName = "Prime qualité", RuleType = "quality_bonus", Amount = 200, Role = "agent" },
                new() { RuleName = "Prime installation", RuleType = "installation_bonus", Amount = 300, Role = "agent" },
                new() { RuleName = "Pénalité refus", RuleType = "refus_penalty", Amount = 30, Role = "agent" },
                new() { RuleName = "Pénalité absence", RuleType = "absence_penalty", Amount = 100, Role = "agent" },
                new() { RuleName = "Salaire de base", RuleType = "base_salary", Amount = 1800, Role = "qualite" },
                new() { RuleName = "Prime qualité", RuleType = "quality_bonus", Amount = 250, Role = "qualite" },
            };
            context.SalaryRules.AddRange(defaultRules);
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
