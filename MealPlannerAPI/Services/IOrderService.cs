using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services;

public interface IOrderService
{
    Task<ApiResponse<OrderDto>> CreateOrderAsync(int userId, CreateOrderRequest request);
    Task<ApiResponse<OrderDto>> CreateOrderFromMealPlanAsync(int userId, int mealPlanId, CreateOrderRequest request);
    Task<ApiResponse<OrderDto>> GetOrderByIdAsync(int orderId);
    Task<ApiResponse<List<OrderDto>>> GetUserOrdersAsync(int userId, int page = 1, int pageSize = 10);
    Task<ApiResponse<List<OrderDto>>> GetAllOrdersAsync(int page = 1, int pageSize = 20, string? status = null); // Admin
    Task<ApiResponse<OrderDto>> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusRequest request);
    Task<ApiResponse<bool>> CancelOrderAsync(int orderId, string reason);
}
