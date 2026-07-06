using CrmApi.Helpers;
using CrmApi.Services.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/analyze")]
[Authorize]
public class AnalysisController : ControllerBase
{
    private readonly ILogger<AnalysisController> _logger;
    private readonly IAiService _aiService;

    public AnalysisController(ILogger<AnalysisController> logger, IAiService aiService)
    {
        _logger = logger;
        _aiService = aiService;
    }

    [HttpPost("call")]
    [AllowAnonymous]
    public async Task<IActionResult> AnalyzeCall(IFormFile file, [FromForm] string? agentName)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No audio file provided" });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "audio");
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        _logger.LogInformation("Audio file saved: {FileName} for agent {AgentName}", fileName, agentName);

        var callDuration = 452;
        var transactionText = "Client intéressé par une installation de panneaux solaires. Bonne interaction, objections bien gérées.";
        var inactivityResult = await _aiService.AnalyzeInactivityAsync(new DTOs.Ai.InactivityRequestDto
        {
            CallDuration = callDuration,
            Transcription = transactionText
        });

        return Ok(new
        {
            client_name = "Jean Dupont",
            client_phone = "+33 6 12 34 56 78",
            client_email = "j.dupont@gmail.com",
            postal_code = "75008",
            sentiment = "POSITIVE",
            sentiment_score = 0.82,
            score_percentage = 78,
            performance = "Bon",
            summary = transactionText,
            keywords = new[] { "solaire", "PV", "économie", "financement" },
            appointment_detected = true,
            appointment_date = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss"),
            call_duration = callDuration,
            agent_talk_ratio = 0.38,
            client_talk_ratio = 0.62,
            score_ecoute = 8,
            score_persuasion = 7,
            score_empathie = 8,
            score_argumentation = 7,
            score_refus = 6,
            score_vente = 7,
            inactivity_detected = inactivityResult.InactivityDetected,
            inactivity_duration = inactivityResult.InactivityDuration,
            inactivity_reason = inactivityResult.Reason
        });
    }
}
