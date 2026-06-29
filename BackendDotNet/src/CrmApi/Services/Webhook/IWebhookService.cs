namespace CrmApi.Services.Webhook;

public interface IWebhookService
{
    Task<Dictionary<string, string>> GetEndpointsAsync();
    Task<object> ProcessWebhookAsync(Dictionary<string, object> data, string? source);
    bool VerifyAircallSignature(byte[] payload, string signature);
    bool VerifyAsteriskToken(string? token);
}
