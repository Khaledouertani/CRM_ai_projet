namespace CrmApi.Models.Entities;

public class AttendanceBreak
{
    public int Id { get; set; }
    public int AttendanceId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int DurationMinutes { get; set; }

    public Attendance Attendance { get; set; } = null!;
}
