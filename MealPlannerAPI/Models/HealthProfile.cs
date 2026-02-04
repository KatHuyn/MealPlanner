using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public class HealthProfile
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal? Weight { get; set; } // kg
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal? Height { get; set; } // cm
    
    public int? Age { get; set; }
    
    [MaxLength(20)]
    public string? Gender { get; set; } // Male, Female, Other
    
    [MaxLength(50)]
    public string? ActivityLevel { get; set; } // Sedentary, Light, Moderate, Active, Very Active
    
    [MaxLength(500)]
    public string? Allergies { get; set; } // Comma-separated: "Đậu phộng, Hải sản, Sữa"
    
    [MaxLength(500)]
    public string? HealthConditions { get; set; } // Comma-separated: "Tiểu đường, Cao huyết áp"
    
    [MaxLength(500)]
    public string? DietaryPreferences { get; set; } // "Chay, Keto, Low-carb"
    
    [MaxLength(1000)]
    public string? Goals { get; set; } // "Giảm cân, Tăng cơ, Duy trì sức khỏe"
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation property
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
