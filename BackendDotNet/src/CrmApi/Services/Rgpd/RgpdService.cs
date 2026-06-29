using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CrmApi.Data;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services.Rgpd;

public class RgpdService : IRgpdService
{
    private readonly ApplicationDbContext _context;

    public RgpdService(ApplicationDbContext context) => _context = context;

    public string AnonymizeTranscript(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        text = Regex.Replace(text, @"\b(?:\d[ \-]?){13,16}\d\b", "[CB CENSURÉE]");
        text = Regex.Replace(text, @"\b0[1-9](?:[ .\-]?\d{2}){4}\b", "[TÉL CENSURÉ]");
        text = Regex.Replace(text, @"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", "[EMAIL CENSURÉ]");
        text = Regex.Replace(text, @"\bFR\d{2}[\s]?(?:\d{4}[\s]?){5}\d{3}\b", "[IBAN CENSURÉ]");
        text = Regex.Replace(text, @"\b(?:M\.|Mme|Mlle)\s+[A-Z][a-z]+", "[NOM CENSURÉ]");
        return text;
    }

    public string HashIdentifier(string identifier)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(identifier));
        return Convert.ToHexString(hash).ToLowerInvariant()[..16];
    }

    public async Task<Dictionary<string, object>> DeleteOldRecordsAsync(int retentionMonths = 12)
    {
        var cutoff = DateTime.UtcNow.AddMonths(-retentionMonths);
        var callsDeleted = 0; var logsDeleted = 0;
        var oldCalls = await _context.Calls.Where(c => c.CreatedAt < cutoff).ToListAsync();
        callsDeleted = oldCalls.Count;
        _context.Calls.RemoveRange(oldCalls);
        var oldLogs = await _context.Logs.Where(l => l.Timestamp < cutoff).ToListAsync();
        logsDeleted = oldLogs.Count;
        _context.Logs.RemoveRange(oldLogs);
        await _context.SaveChangesAsync();
        return new Dictionary<string, object> { ["calls_deleted"] = callsDeleted, ["logs_deleted"] = logsDeleted, ["retention_months"] = retentionMonths };
    }

    public async Task LogActionAsync(string userId, string action, string details)
    {
        _context.Logs.Add(new Models.Entities.Log { UserId = userId, Action = action, Details = details });
        await _context.SaveChangesAsync();
    }

    public async Task<List<Dictionary<string, object>>> GetAuditTrailAsync(string? userId, int days = 30)
    {
        var since = DateTime.UtcNow.AddDays(-days);
        var query = _context.Logs.AsNoTracking().Where(l => l.Timestamp >= since);
        if (!string.IsNullOrEmpty(userId)) query = query.Where(l => l.UserId == userId);
        var logs = await query.OrderByDescending(l => l.Timestamp).ToListAsync();
        return logs.Select(l => new Dictionary<string, object> { ["id"] = l.Id, ["user_id"] = l.UserId ?? "", ["action"] = l.Action ?? "", ["details"] = l.Details ?? "", ["timestamp"] = l.Timestamp }).ToList();
    }
}
