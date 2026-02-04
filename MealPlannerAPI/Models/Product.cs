using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public class Product
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
    
    [MaxLength(50)]
    public string? Unit { get; set; } // kg, g, cái, bó, hộp...
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal QuantityInStock { get; set; }
    
    [MaxLength(100)]
    public string? Category { get; set; } // Rau củ, Thịt, Hải sản, Gia vị...
    
    [MaxLength(500)]
    public string? ImageUrl { get; set; }
    
    public bool IsAvailable { get; set; } = true;
    
    // Thông tin dinh dưỡng (per 100g)
    [Column(TypeName = "decimal(8,2)")]
    public decimal? Calories { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? Protein { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? Carbs { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? Fat { get; set; }
    
    [Column(TypeName = "decimal(8,2)")]
    public decimal? Fiber { get; set; }
    
    [MaxLength(200)]
    public string? Keywords { get; set; } // Từ khóa tìm kiếm: "cà chua, tomato, chua"
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<MealPlanIngredient> MealPlanIngredients { get; set; } = new List<MealPlanIngredient>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
