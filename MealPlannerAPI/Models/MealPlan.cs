using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public class MealPlan
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [MaxLength(500)]
    public string? UserRequest { get; set; } // Yêu cầu của người dùng: "Tôi bị đau bao tử..."
    
    public DateTime PlanDate { get; set; } = DateTime.UtcNow.Date;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    public ICollection<Meal> Meals { get; set; } = new List<Meal>();
}
