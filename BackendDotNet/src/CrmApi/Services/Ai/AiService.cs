using CrmApi.Data;
using CrmApi.DTOs.Ai;
using CrmApi.Helpers;
using CrmApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CrmApi.Services.Ai;

public class AiService : IAiService
{
    private readonly ApplicationDbContext _context;

    public AiService(ApplicationDbContext context) => _context = context;

    public Task<EligibilityResultDto> ScoreEligibilityAsync(EligibilityRequestDto dto)
    {
        return Task.FromResult(EligibilityCalculator.Calculate(dto.Revenus, dto.Chauffage, dto.Toiture, dto.Isolation, dto.Consommation, dto.CreditScore, dto.SituationBancaire, dto.ProjectType));
    }

    public async Task<EligibilityResultDto> AnalyzeEligibilityAsync(int userId, EligibilityRequestDto dto)
    {
        var result = EligibilityCalculator.Calculate(dto.Revenus, dto.Chauffage, dto.Toiture, dto.Isolation, dto.Consommation, dto.CreditScore, dto.SituationBancaire, dto.ProjectType);
        _context.AiEligibilityLogs.Add(new AiEligibilityLog { AgentId = userId, ClientData = JsonSerializer.Serialize(dto), Result = JsonSerializer.Serialize(result) });
        await _context.SaveChangesAsync();
        return result;
    }

    public Task<FakeRdvResultDto> DetectFakeRdvAsync(FakeRdvRequestDto dto)
    {
        int risk = 0; var flags = new List<string>();
        if (dto.QualityScore.HasValue && dto.QualityScore.Value < 30) { risk += 30; flags.Add("Low quality score"); }
        if (dto.Revenus.HasValue && dto.Revenus.Value > 80000) { risk += 20; flags.Add("Very high income - check veracity"); }
        if (!string.IsNullOrEmpty(dto.ClientPhone) && dto.ClientPhone.Length < 6) { risk += 25; flags.Add("Suspicious phone number"); }
        if (!string.IsNullOrEmpty(dto.AppointmentTime) && (dto.AppointmentTime.Contains("23:") || dto.AppointmentTime.Contains("00:"))) { risk += 15; flags.Add("Unusual appointment time"); }
        var verdict = risk switch { >= 60 => "HIGH_RISK", >= 30 => "SUSPICIOUS", _ => "CLEAN" };
        return Task.FromResult(new FakeRdvResultDto { RiskScore = risk, Verdict = verdict, Flags = flags, AppointmentId = dto.Id, AgentId = dto.AgentId });
    }

    public async Task<AiInsightsDto> GetInsightsAsync(int agentId)
    {
        var appointments = await _context.CrmAppointments.AsNoTracking().Where(a => a.AgentId == agentId).ToListAsync();
        var calls = await _context.Calls.AsNoTracking().Where(c => c.AgentId == agentId.ToString()).ToListAsync();
        return new AiInsightsDto
        {
            AgentId = agentId,
            Appointments = new AppointmentStatsDto { Total = appointments.Count, AvgScore = appointments.Count > 0 ? appointments.Average(a => a.QualityScore) : 0 },
            FinancingDistribution = appointments.GroupBy(a => a.FinancingStatus).Select(g => new DistributionDto { Label = g.Key, Count = g.Count() }).ToList(),
            ProjectDistribution = appointments.GroupBy(a => a.ProjectType).Select(g => new DistributionDto { Label = g.Key, Count = g.Count() }).ToList(),
            CallStats = new CallStatsDto { TotalCalls = calls.Count, AvgCallScore = calls.Count > 0 ? calls.Average(c => c.ScorePercentage) : 0 },
            Tip = calls.Count > 0 && calls.Average(c => c.ScorePercentage) < 50 ? "Focus on improving call quality scores" : "Good performance, keep it up!"
        };
    }

    public Task<QualificationResultDto> CheckQualificationAsync(QualificationCheckDto dto)
    {
        var qualMap = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["PV"] = new[] { "panneau", "solaire", "photovoltaique", "toiture", "installation", "électricité", "onduleur", "production", "kwh", "ensoleillement" },
            ["PAC"] = new[] { "pompe", "chaleur", "climatisation", "chauffage", "radiateur", "thermostat", "aérothermie", "géothermie", "COP", "réversible" },
            ["ISOLATION"] = new[] { "isolation", "isolant", "combles", "murs", "laine", "polystyrène", "thermique", "acoustique", "ITE", "ITI" },
            ["CCE"] = new[] { "chauffage", "eau", "cumulus", "ballon", "chauffe-eau", "thermique", "éléc", "résistance" }
        };
        var keywords = qualMap.TryGetValue(dto.Qualification, out var kws) ? kws : Array.Empty<string>();
        var transcriptLower = dto.Transcript.ToLowerInvariant();
        var found = keywords.Count(kw => transcriptLower.Contains(kw));
        var ratio = keywords.Length > 0 ? (double)found / keywords.Length : 0;
        var coherent = keywords.Length == 0 || ratio >= 0.4;

        var refusalPatterns = new[] { "pas intéressé", "trop cher", "je réfléchis", "pas maintenant", "je ne veux pas", "merci", "non merci", "rappelez plus tard" };
        var refusalFound = refusalPatterns.Count(r => transcriptLower.Contains(r));
        var refusalDetected = refusalFound >= 2;

        var details = coherent
            ? $"Qualification cohérente ({found}/{keywords.Length} mots-clés, ratio {ratio:P0})"
            : $"Attention: seulement {found}/{keywords.Length} mots-clés trouvés (ratio {ratio:P0})";
        if (refusalDetected)
            details += ". Présence de motifs de refus détectés";

        return Task.FromResult(new QualificationResultDto
        {
            Coherent = coherent && !refusalDetected,
            Details = details,
            RefusalDetected = refusalDetected
        });
    }

    public Task<RefusalResultDto> DetectRefusalAsync(RefusalCheckDto dto)
    {
        var refusalKeywords = new[] { "pas intéressé", "trop cher", "je réfléchis", "pas maintenant", "je ne veux pas", "non merci", "rappelez plus tard", "ça ne m'intéresse pas", "laissez tomber", "pas le temps", "déjà équipé", "pas besoin", "je verrai", "peut-être plus tard" };
        var transcriptLower = dto.Transcript.ToLowerInvariant();
        var found = refusalKeywords.Where(k => transcriptLower.Contains(k)).ToList();

        var pricePatterns = new[] { "trop cher", "budget", "coûte", "prix", "pas les moyens", "économies" };
        var timePatterns = new[] { "pas le temps", "occupé", "travail", "pas maintenant", "rappel" };
        var needPatterns = new[] { "déjà équipé", "pas besoin", "satisfait", "déjà", "pas intéressé" };
        var deferPatterns = new[] { "réfléchis", "je verrai", "peut-être", "plus tard", "autre fois" };

        var categories = new List<string>();
        if (pricePatterns.Any(p => transcriptLower.Contains(p))) categories.Add("budget");
        if (timePatterns.Any(p => transcriptLower.Contains(p))) categories.Add("timing");
        if (needPatterns.Any(p => transcriptLower.Contains(p))) categories.Add("besoin");
        if (deferPatterns.Any(p => transcriptLower.Contains(p))) categories.Add("report");

        return Task.FromResult(new RefusalResultDto
        {
            RefusalDetected = found.Count > 0,
            Confidence = found.Count > 0 ? Math.Min(found.Count * 20, 95) : 0,
            RefusalKeywords = found,
            Categories = categories,
            PrimaryMotive = categories.FirstOrDefault() ?? "none",
            SuggestedResponse = (categories.FirstOrDefault()) switch
            {
                "budget" => "Mettre en avant les aides financières et le retour sur investissement",
                "timing" => "Proposer un rendez-vous à un moment plus adapté",
                "besoin" => "Identifier les besoins non couverts actuels",
                "report" => "Proposer un suivi à une date précise plutôt qu'un rappel vague",
                _ => "Poser une question ouverte pour identifier le vrai motif"
            }
        });
    }

    public Task<AppointmentDetectResultDto> DetectAppointmentAsync(AppointmentDetectDto dto)
    {
        var patterns = new[] { @"rdv", @"rendez[- ]vous", @"le \d{1,2}", @"demain", @"lundi|mardi|mercredi|jeudi|vendredi", @"à \d{1,2}[h:]" };
        var detected = patterns.Any(p => System.Text.RegularExpressions.Regex.IsMatch(dto.Transcript, p, System.Text.RegularExpressions.RegexOptions.IgnoreCase));
        return Task.FromResult(new AppointmentDetectResultDto { Detected = detected, Confidence = detected ? 70 : 0, RequiresValidation = true });
    }

    public Task<AnonymizeResultDto> AnonymizeTranscriptAsync(AnonymizeDto dto)
    {
        var text = dto.Transcript;
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\b\d{16}\b", "****-****-****-****");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b", "** ** ** ** **");
        return Task.FromResult(new AnonymizeResultDto { Anonymized = text });
    }

    public Task<InactivityResultDto> AnalyzeInactivityAsync(InactivityRequestDto dto)
    {
        var detected = false;
        var duration = 0f;
        string? reason = null;

        if (dto.CallDuration.HasValue && dto.CallDuration.Value > 0)
        {
            if (dto.CallDuration.Value < 30)
            {
                detected = true;
                duration = 30 - dto.CallDuration.Value;
                reason = "Appel anormalement court (moins de 30s)";
            }
            else if (!string.IsNullOrEmpty(dto.Transcription))
            {
                var wordCount = dto.Transcription.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
                var expectedWords = dto.CallDuration.Value * 2;
                if (wordCount < expectedWords * 0.3)
                {
                    detected = true;
                    duration = (float)Math.Round(dto.CallDuration.Value * (1f - (float)wordCount / expectedWords), 1);
                    reason = "Faible volume de parole par rapport à la durée d'appel";
                }
            }
        }

        return Task.FromResult(new InactivityResultDto
        {
            InactivityDetected = detected,
            InactivityDuration = duration,
            Reason = reason
        });
    }
}
