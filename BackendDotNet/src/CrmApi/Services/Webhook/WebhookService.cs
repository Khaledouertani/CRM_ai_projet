using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CrmApi.Data;

namespace CrmApi.Services.Webhook;

public class WebhookService : IWebhookService
{
    private readonly ApplicationDbContext _context;
    private readonly string? _aircallSecret;
    private readonly string? _asteriskToken;

    public WebhookService(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _aircallSecret = config["Webhooks:AircallApiSecret"];
        _asteriskToken = config["Webhooks:AsteriskWebhookToken"];
    }

    public async Task<Dictionary<string, string>> GetEndpointsAsync()
    {
        return await Task.FromResult(new Dictionary<string, string>
        {
            { "aircall", "/webhook/aircall" },
            { "asterisk", "/webhook/asterisk" },
            { "generic", "/webhook/generic" }
        });
    }

    public async Task<object> ProcessWebhookAsync(Dictionary<string, object> data, string? source)
    {
        return await Task.FromResult(new { success = true, message = "Webhook processed", timestamp = DateTime.UtcNow });
    }

    public bool VerifyAircallSignature(byte[] payload, string signature)
    {
        if (string.IsNullOrEmpty(_aircallSecret)) return false;
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_aircallSecret));
        var hash = hmac.ComputeHash(payload);
        return Convert.ToHexString(hash).ToLowerInvariant() == signature.ToLowerInvariant();
    }

    public bool VerifyAsteriskToken(string? token) => token == _asteriskToken;
}
