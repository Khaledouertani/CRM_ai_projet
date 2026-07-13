namespace CrmApi.Models.Entities;

public class ManualEvaluation
{
    public int Id { get; set; }
    public int AgentId { get; set; }
    public int EvaluatorId { get; set; }
    public DateTime EvaluationDate { get; set; } = DateTime.UtcNow;
    public string? CallRef { get; set; }
    public float GlobalScore { get; set; }
    public string? Decision { get; set; }
    public string? Commentaires { get; set; }
    public string? ScoresJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Agent { get; set; } = null!;
    public User Evaluator { get; set; } = null!;
}
