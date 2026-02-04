using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public class MealPlanIngredient
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int MealId { get; set; }
    
    public int? ProductId { get; set; } // Null nếu không tìm thấy sản phẩm trong kho
    
    [Required]
    [MaxLength(200)]
    public string IngredientName { get; set; } = string.Empty; // Tên nguyên liệu từ AI
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal Quantity { get; set; }
    
    [MaxLength(50)]
    public string? Unit { get; set; } // g, kg, ml, muỗng canh...
    
    [MaxLength(200)]
    public string? Notes { get; set; } // Ghi chú: "thái nhỏ", "băm nhuyễn"...
    
    public bool IsMatched { get; set; } = false; // Đã khớp với sản phẩm trong kho chưa
    
    // Navigation properties
    [ForeignKey("MealId")]
    public Meal Meal { get; set; } = null!;
    
    [ForeignKey("ProductId")]
    public Product? Product { get; set; }
}
