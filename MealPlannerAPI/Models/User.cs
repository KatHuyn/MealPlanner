using System.ComponentModel.DataAnnotations;

namespace MealPlannerAPI.Models;

public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? Phone { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    public bool IsAdmin { get; set; } = false;
    
    // Navigation properties
    public HealthProfile? HealthProfile { get; set; }
    public ICollection<MealPlan> MealPlans { get; set; } = new List<MealPlan>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<ChatHistory> ChatHistories { get; set; } = new List<ChatHistory>();
}
