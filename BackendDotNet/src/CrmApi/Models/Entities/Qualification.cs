namespace CrmApi.Models.Entities;

public class Qualification
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? ExpectedKeywords { get; set; }
}
