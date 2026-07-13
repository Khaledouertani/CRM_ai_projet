namespace CrmApi.Models.Entities;

public class SourceFile
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
