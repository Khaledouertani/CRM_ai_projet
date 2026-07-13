using System.ComponentModel.DataAnnotations.Schema;

namespace CrmApi.Models.Entities;

public class Call
{
    public int Id { get; set; }
    public string AgentId { get; set; } = string.Empty;
    public string AgentName { get; set; } = string.Empty;
    public int? LeadId { get; set; }
    public string? AudioFile { get; set; }
    public string? Transcription { get; set; }
    public string? LabeledTranscript { get; set; }
    public string? AgentText { get; set; }
    public string? ClientText { get; set; }
    public string? Sentiment { get; set; }
    public float SentimentScore { get; set; }
    public float ScorePercentage { get; set; }
    public string? Performance { get; set; }
    public string? Summary { get; set; }
    public string? Keywords { get; set; }
    public string? CallType { get; set; }
    public int? CallDuration { get; set; }
    public string? Problem { get; set; }
    public string? PostalCode { get; set; }
    public bool ScriptRespected { get; set; }
    public string? CustomerIntent { get; set; }
    public bool ObjectionsHandled { get; set; }
    public int AgentPoliteness { get; set; } = 5;
    public string? NextSteps { get; set; }
    public string? AppointmentDate { get; set; }
    public int AppointmentConfidence { get; set; }
    public int ScoreEcoute { get; set; }
    public int ScorePersuasion { get; set; }
    public int ScoreEmpathie { get; set; }
    public int ScoreArgumentation { get; set; }
    public int ScoreRefus { get; set; }
    public int ScoreVente { get; set; }
    public float AgentTalkRatio { get; set; }
    public float ClientTalkRatio { get; set; }
    public float AgentSeconds { get; set; }
    public float ClientSeconds { get; set; }
    public string DiarizationMethod { get; set; } = "none";
    public bool InactivityDetected { get; set; }
    public float InactivityDuration { get; set; }
    public string? RefusalReason { get; set; }
    public bool? QualificationMatch { get; set; }
    public float? CoherenceScore { get; set; }
    public string? Qualification { get; set; }
    public bool? QualificationCoherence { get; set; }
    public DateTime? CallDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Status { get; set; }

    [NotMapped]
    public List<string>? KeywordsList
    {
        get => Keywords != null ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(Keywords) : null;
        set => Keywords = value != null ? System.Text.Json.JsonSerializer.Serialize(value) : null;
    }
}
