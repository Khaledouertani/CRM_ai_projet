namespace CrmApi.Services.Rgpd;

public interface IRgpdService
{
    string AnonymizeTranscript(string text);
    string HashIdentifier(string identifier);
    Task<Dictionary<string, object>> DeleteOldRecordsAsync(int retentionMonths = 12);
    Task LogActionAsync(string userId, string action, string details);
    Task<List<Dictionary<string, object>>> GetAuditTrailAsync(string? userId, int days = 30);
}
