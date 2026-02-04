using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public class ChatHistory
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string UserMessage { get; set; } = string.Empty;
    
    [MaxLength(5000)]
    public string? AiResponse { get; set; }
    
    public int? MealPlanId { get; set; } // Nếu AI trả về thực đơn
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    [ForeignKey("MealPlanId")]
    public MealPlan? MealPlan { get; set; }
}
