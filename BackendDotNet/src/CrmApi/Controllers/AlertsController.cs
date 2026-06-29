using CrmApi.DTOs.Alert;
using CrmApi.Helpers;
using CrmApi.Services.Alert;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertsController(IAlertService alertService) => _alertService = alertService;

    [HttpGet("rules")]
    public async Task<IActionResult> GetRules()
    {
        try { return Ok(new { rules = await _alertService.GetRulesAsync() }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("rules/{ruleType}")]
    public async Task<IActionResult> GetRuleByType(string ruleType)
    {
        try { return Ok(await _alertService.GetRuleByTypeAsync(ruleType)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("rules")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateRule([FromBody] CreateAlertRuleDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(new { status = "success", message = await _alertService.CreateRuleAsync(dto) }); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPut("rules/{ruleId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateRule(int ruleId, [FromBody] UpdateAlertRuleDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var message = await _alertService.UpdateRuleAsync(ruleId, dto);
            return Ok(new { status = "success", message });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpDelete("rules/{ruleId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteRule(int ruleId)
    {
        try
        {
            var success = await _alertService.DeleteRuleAsync(ruleId);
            if (!success) return NotFound(new { error = "Alert rule not found" });
            return Ok(new { status = "success" });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] string? agentName, [FromQuery] int limit = 50)
    {
        try { return Ok(new { history = await _alertService.GetHistoryAsync(agentName, limit) }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("check/{agentName}")]
    public async Task<IActionResult> CheckAlerts(string agentName, [FromQuery] float? score, [FromQuery] float? inactiveMinutes, [FromQuery] float? conversionRate)
    {
        try { return Ok(await _alertService.CheckAlertsAsync(agentName, score, inactiveMinutes, conversionRate)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("realtime/{agentName}")]
    public async Task<IActionResult> CheckRealtime(string agentName)
    {
        try { return Ok(await _alertService.CheckRealtimeAlertsAsync(agentName)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("notify")]
    public async Task<IActionResult> Notify([FromBody] Dictionary<string, object> alert)
    {
        if (alert == null) return BadRequest(new { error = "Request body is required" });
        try
        {
            var success = await _alertService.NotifyAlertAsync(alert);
            if (!success) return BadRequest(new { status = "error", error = "Failed to send notification" });
            return Ok(new { status = "success" });
        }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}
