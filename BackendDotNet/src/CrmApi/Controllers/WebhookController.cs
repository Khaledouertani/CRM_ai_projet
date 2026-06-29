using CrmApi.Services.Webhook;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("webhook")]
public class WebhookController : ControllerBase
{
    private readonly IWebhookService _webhookService;

    public WebhookController(IWebhookService webhookService) => _webhookService = webhookService;

    [HttpGet("endpoints")]
    public async Task<IActionResult> GetEndpoints()
    {
        try { return Ok(await _webhookService.GetEndpointsAsync()); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("aircall")]
    public async Task<IActionResult> Aircall([FromBody] Dictionary<string, object> data)
    {
        if (data == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var result = await _webhookService.ProcessWebhookAsync(data, "aircall");
            return Ok(result);
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("asterisk")]
    public async Task<IActionResult> Asterisk([FromBody] Dictionary<string, object> data, [FromQuery] string? token)
    {
        if (!_webhookService.VerifyAsteriskToken(token)) return Unauthorized(new { error = "Invalid token" });
        if (data == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var result = await _webhookService.ProcessWebhookAsync(data, "asterisk");
            return Ok(result);
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("generic")]
    public async Task<IActionResult> Generic([FromBody] Dictionary<string, object> data)
    {
        if (data == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _webhookService.ProcessWebhookAsync(data, "generic")); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
