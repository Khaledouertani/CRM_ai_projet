using CrmApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/analyze")]
[Authorize]
public class AnalysisController : ControllerBase
{
    private readonly ILogger<AnalysisController> _logger;

    public AnalysisController(ILogger<AnalysisController> logger)
    {
        _logger = logger;
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
            summary = "Client intéressé par une installation de panneaux solaires. Bonne interaction, objections bien gérées.",
            keywords = new[] { "solaire", "PV", "économie", "financement" },
            appointment_detected = true,
            appointment_date = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss"),
            call_duration = 452,
            agent_talk_ratio = 0.38,
            client_talk_ratio = 0.62,
            score_ecoute = 8,
            score_persuasion = 7,
            score_empathie = 8,
            score_argumentation = 7,
            score_refus = 6,
            score_vente = 7
        });
    }
}
