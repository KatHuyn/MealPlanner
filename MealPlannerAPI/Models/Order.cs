using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MealPlannerAPI.Models;

public enum OrderStatus
{
    Pending = 1,        // Chờ xử lý
    Confirmed = 2,      // Đã xác nhận
    Processing = 3,     // Đang xử lý
    Shipping = 4,       // Đang giao hàng
    Delivered = 5,      // Đã giao hàng
    Cancelled = 6       // Đã hủy
}

public class Order
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    public int? MealPlanId { get; set; } // Liên kết với thực đơn (nếu có)
    
    [Required]
    [MaxLength(50)]
    public string OrderCode { get; set; } = string.Empty;
    
    [Required]
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? DiscountAmount { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ShippingFee { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal FinalAmount { get; set; }
    
    [MaxLength(500)]
    public string? ShippingAddress { get; set; }
    
    [MaxLength(20)]
    public string? ReceiverPhone { get; set; }
    
    [MaxLength(100)]
    public string? ReceiverName { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ConfirmedAt { get; set; }
    
    public DateTime? ShippedAt { get; set; }
    
    public DateTime? DeliveredAt { get; set; }
    
    public DateTime? CancelledAt { get; set; }
    
    [MaxLength(500)]
    public string? CancellationReason { get; set; }
    
    [MaxLength(50)]
    public string? PaymentMethod { get; set; } // COD or BankTransfer
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    [ForeignKey("MealPlanId")]
    public MealPlan? MealPlan { get; set; }
    
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
