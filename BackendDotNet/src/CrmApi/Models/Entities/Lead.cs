namespace CrmApi.Models.Entities;

public class Lead
{
    public int Id { get; set; }
    public string? CompanyName { get; set; }
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Status { get; set; }
    public string? PostalCode { get; set; }
    public int? AgentId { get; set; }
    public string? CampaignName { get; set; }
}
