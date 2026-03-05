namespace MealPlannerAPI.Models.DTOs;

// User DTOs
public class RegisterRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsAdmin { get; set; }
    public HealthProfileDto? HealthProfile { get; set; }
}

// Health Profile DTOs
public class HealthProfileDto
{
    public int Id { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? ActivityLevel { get; set; }
    public string? Allergies { get; set; }
    public string? HealthConditions { get; set; }
    public string? DietaryPreferences { get; set; }
    public string? Goals { get; set; }
}

public class UpdateHealthProfileRequest
{
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? ActivityLevel { get; set; }
    public string? Allergies { get; set; }
    public string? HealthConditions { get; set; }
    public string? DietaryPreferences { get; set; }
    public string? Goals { get; set; }
}

// Product DTOs
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? Unit { get; set; }
    public decimal QuantityInStock { get; set; }
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; }
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
}

public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? Unit { get; set; }
    public decimal QuantityInStock { get; set; }
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbs { get; set; }
    public decimal? Fat { get; set; }
    public decimal? Fiber { get; set; }
    public string? Keywords { get; set; }
}

// MealPlan DTOs
public class MealPlanDto
{
    public int Id { get; set; }
    public string? UserRequest { get; set; }
    public DateTime PlanDate { get; set; }
    public List<MealDto> Meals { get; set; } = new();
    public decimal TotalCost { get; set; }
}

public class MealDto
{
    public int Id { get; set; }
    public string MealType { get; set; } = string.Empty;
    public string DishName { get; set; } = string.Empty;
    public string? Recipe { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? PrepTime { get; set; }
    public int? CookTime { get; set; }
    public int? Servings { get; set; }
    public decimal? TotalCalories { get; set; }
    public decimal? TotalProtein { get; set; }
    public decimal? TotalCarbs { get; set; }
    public decimal? TotalFat { get; set; }
    public List<IngredientDto> Ingredients { get; set; } = new();
}

public class IngredientDto
{
    public int Id { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Notes { get; set; }
    public bool IsMatched { get; set; }
    public ProductDto? Product { get; set; }
}

// Chat DTOs
public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
}

public class ChatResponse
{
    public string Message { get; set; } = string.Empty;
    public MealPlanDto? MealPlan { get; set; }
    public bool Success { get; set; }
}

// Order DTOs
public class OrderDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? ShippingFee { get; set; }
    public decimal FinalAmount { get; set; }
    public string? ShippingAddress { get; set; }
    public string? ReceiverPhone { get; set; }
    public string? ReceiverName { get; set; }
    public string? Notes { get; set; }
    public string? PaymentMethod { get; set; } // COD or BankTransfer
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

public class CreateOrderRequest
{
    public int? MealPlanId { get; set; }
    public List<OrderItemRequest> Items { get; set; } = new();
    public string? ShippingAddress { get; set; }
    public string? ReceiverPhone { get; set; }
    public string? ReceiverName { get; set; }
    public string? Notes { get; set; }
    public string? PaymentMethod { get; set; } // COD or BankTransfer
}

public class OrderItemRequest
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

// Ingredient management DTOs
public class SwapIngredientRequest
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
}

public class AddIngredientRequest
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
}

// Dashboard Stats DTOs
public class DashboardStatsDto
{
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ConfirmedOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int ShippingOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int CancelledOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal MonthRevenue { get; set; }
    public int TodayOrders { get; set; }
    public int MonthOrders { get; set; }
    public List<TopProductDto> TopProducts { get; set; } = new();
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal TotalQuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

// API Response
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
}
