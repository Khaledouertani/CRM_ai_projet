using CrmApi.DTOs.Ai;
using CrmApi.DTOs.Attendance;
using CrmApi.Helpers;
using CrmApi.Services.Ai;
using CrmApi.Services.Attendance;
using CrmApi.Services.Rgpd;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api")]
public class ApiController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly IAttendanceService _attendanceService;
    private readonly IRgpdService _rgpdService;

    public ApiController(IAiService aiService, IAttendanceService attendanceService, IRgpdService rgpdService)
    {
        _aiService = aiService;
        _attendanceService = attendanceService;
        _rgpdService = rgpdService;
    }

    [HttpPost("attendance/check")]
    public async Task<IActionResult> CheckAttendance([FromBody] AttendanceCheckRequestDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _attendanceService.CheckAttendanceAsync(dto.AgentId, dto.ScheduledStart, dto.ScheduledEnd, dto.TargetDate)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("attendance/team/{targetDate}")]
    public async Task<IActionResult> TeamAttendance(DateTime targetDate)
    {
        try { return Ok(await _attendanceService.GetTeamAttendanceAsync(targetDate)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("qualification/check")]
    public async Task<IActionResult> CheckQualification([FromBody] QualificationCheckDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _aiService.CheckQualificationAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("appointment/detect")]
    public async Task<IActionResult> DetectAppointment([FromBody] AppointmentDetectDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _aiService.DetectAppointmentAsync(dto)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpPost("transcript/anonymize")]
    public async Task<IActionResult> AnonymizeTranscript([FromBody] AnonymizeDto dto)
    {
        if (dto == null) return BadRequest(new { error = "Request body is required" });
        try { return Ok(await _aiService.AnonymizeTranscriptAsync(dto)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }

    [HttpGet("audit-trail")]
    public async Task<IActionResult> GetAuditTrail([FromQuery] string? userId, [FromQuery] int days = 30)
    {
        try { return Ok(await _rgpdService.GetAuditTrailAsync(userId, days)); }
        catch (Exception ex) { return Problem(ex.Message); }
    }
}

public class AttendanceCheckRequestDto
{
    public int AgentId { get; set; }
    public string ScheduledStart { get; set; } = string.Empty;
    public string ScheduledEnd { get; set; } = string.Empty;
    public DateTime? TargetDate { get; set; }
}
