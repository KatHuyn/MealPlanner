using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public class OrderItem
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int OrderId { get; set; }
    
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Quantity { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; } // Giá tại thời điểm đặt hàng
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }
    
    // Navigation properties
    [ForeignKey("OrderId")]
    public Order Order { get; set; } = null!;
    
    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;
}
