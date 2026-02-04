using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public enum MealType
{
    Breakfast = 1,  // Bữa sáng
    Lunch = 2,      // Bữa trưa
    Dinner = 3,     // Bữa tối
    Snack = 4       // Bữa phụ
}

public class Meal
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int MealPlanId { get; set; }
    
    [Required]
    public MealType MealType { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string DishName { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Recipe { get; set; } // Công thức nấu
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(500)]
    public string? ImageUrl { get; set; }
    
    public int? PrepTime { get; set; } // Thời gian chuẩn bị (phút)
    
    public int? CookTime { get; set; } // Thời gian nấu (phút)
    
    public int? Servings { get; set; } // Số phần ăn
    
    // Thông tin dinh dưỡng tổng cộng
    [Column(TypeName = "decimal(8,2)")]
    public decimal? TotalCalories { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? TotalProtein { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? TotalCarbs { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? TotalFat { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("MealPlanId")]
    public MealPlan MealPlan { get; set; } = null!;
    
    public ICollection<MealPlanIngredient> Ingredients { get; set; } = new List<MealPlanIngredient>();
}
