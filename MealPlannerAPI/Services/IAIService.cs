using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services;

public interface IAIService
{
    Task<AIMealPlanResponse?> GenerateMealPlanAsync(AIMealPlanRequest request);
    
    /// <summary>
    /// Chatbot bán hàng sáng tạo với Function Calling
    /// Kiểm tra tồn kho → Gemini tự nghĩ công thức → Gợi ý mua hàng
    /// </summary>
    Task<SalesChatResponse> SalesChatAsync(SalesChatRequest request);
    
    /// <summary>
    /// Gợi ý nguyên liệu thay thế cho một nguyên liệu trong công thức
    /// </summary>
    Task<IngredientSwapResponse> SuggestIngredientSwapsAsync(IngredientSwapRequest request);
}

// ==================== INGREDIENT SWAP DTOs ====================

/// <summary>
/// Request để lấy gợi ý thay thế nguyên liệu
/// </summary>
public class IngredientSwapRequest
{
    public string DishName { get; set; } = string.Empty;
    public string CurrentIngredient { get; set; } = string.Empty;
    public string CurrentUnit { get; set; } = string.Empty;
    public decimal CurrentQuantity { get; set; }
}

/// <summary>
/// Response chứa danh sách nguyên liệu có thể thay thế
/// </summary>
public class IngredientSwapResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SwapSuggestion> Suggestions { get; set; } = new();
}

/// <summary>
/// Một gợi ý thay thế nguyên liệu
/// </summary>
public class SwapSuggestion
{
    public string IngredientName { get; set; } = string.Empty;
    public decimal SuggestedQuantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public int? ProductId { get; set; }
    public decimal? Price { get; set; }
    public bool IsAvailable { get; set; }
}

public class AIMealPlanRequest
{
    public string UserRequest { get; set; } = string.Empty;
    public HealthProfileDto? HealthProfile { get; set; }
    public List<string> AvailableIngredients { get; set; } = new();
    public List<string>? Allergies { get; set; }
    public List<string>? HealthConditions { get; set; }
    public string? DietaryPreferences { get; set; }
}

public class AIMealPlanResponse
{
    public List<AIMealResponse> Meals { get; set; } = new();
    public string? Message { get; set; }
}

public class AIMealResponse
{
    public string MealType { get; set; } = string.Empty; // Breakfast, Lunch, Dinner
    public string DishName { get; set; } = string.Empty;
    public string Recipe { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PrepTime { get; set; }
    public int CookTime { get; set; }
    public int Servings { get; set; }
    public List<AIIngredientResponse> Ingredients { get; set; } = new();
}

public class AIIngredientResponse
{
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

// ==================== SALES CHATBOT DTOs ====================

/// <summary>
/// Request cho Sales Chatbot
/// </summary>
public class SalesChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<SalesChatMessage>? ConversationHistory { get; set; }
}

/// <summary>
/// Lịch sử hội thoại để duy trì context
/// </summary>
public class SalesChatMessage
{
    public string Role { get; set; } = string.Empty; // "user" hoặc "model"
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// Response từ Sales Chatbot
/// </summary>
public class SalesChatResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? SuggestedRecipe { get; set; }
    public List<RecommendedProduct> RecommendedProducts { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public List<string>? OutOfStockItems { get; set; }
}

/// <summary>
/// Sản phẩm được AI gợi ý mua
/// </summary>
public class RecommendedProduct
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Unit { get; set; }
    public decimal QuantityInStock { get; set; }
    public decimal SuggestedQuantity { get; set; }
    public string? SuggestedUnit { get; set; }
    public decimal SubTotal { get; set; }
    public string? ImageUrl { get; set; }
}
