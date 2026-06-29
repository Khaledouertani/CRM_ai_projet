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
            ["PV"] = new[] { "panneau", "solaire", "photovoltaique", "toiture", "installation" },
            ["PAC"] = new[] { "pompe", "chaleur", "climatisation", "chauffage" },
            ["ISOLATION"] = new[] { "isolation", "isolant", "combles", "murs" },
            ["CCE"] = new[] { "chauffage", "eau", "cumulus", "ballon" }
        };
        var keywords = qualMap.TryGetValue(dto.Qualification, out var kws) ? kws : Array.Empty<string>();
        var transcriptLower = dto.Transcript.ToLowerInvariant();
        var found = keywords.Count(kw => transcriptLower.Contains(kw));
        var coherent = keywords.Length == 0 || found >= keywords.Length / 2;
        return Task.FromResult(new QualificationResultDto { Coherent = coherent, Details = coherent ? "Qualification cohérente avec la transcription" : $"Mots-clés trouvés: {found}/{keywords.Length}" });
    }

    public Task<AppointmentDetectResultDto> DetectAppointmentAsync(AppointmentDetectDto dto)
    {
        var patterns = new[] { @"rdv", @"rendez[- ]vous", @"le \d{1,2}", @"demain", @"lundi|mardi|mercredi|jeudi|vendredi", @"à \d{1,2}[h:]" };
        var detected = patterns.Any(p => System.Text.RegularExpressions.Regex.IsMatch(dto.Transcript, p, System.Text.RegularExpressions.RegexOptions.IgnoreCase));
        return Task.FromResult(new AppointmentDetectResultDto { Detected = detected, Confidence = detected ? 70 : 0, RequiresValidation = true });
    }

    public Task<AnonymizeResultDto> AnonymizeTranscriptAsync(AnonymizeDto dto)
    {
        var service = new Services.Rgpd.RgpdService(_context);
        return Task.FromResult(new AnonymizeResultDto { Anonymized = service.AnonymizeTranscript(dto.Transcript) });
    }
}
