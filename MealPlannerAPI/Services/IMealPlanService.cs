using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services;

public interface IMealPlanService
{
    Task<ApiResponse<MealPlanDto>> GenerateMealPlanAsync(int userId, string userRequest);
    Task<ApiResponse<MealPlanDto>> GetMealPlanByIdAsync(int mealPlanId);
    Task<ApiResponse<List<MealPlanDto>>> GetUserMealPlansAsync(int userId, int page = 1, int pageSize = 10);
    Task<ApiResponse<MealPlanDto>> RegenerateMealAsync(int mealPlanId, int mealId);
    Task<ApiResponse<bool>> DeleteMealPlanAsync(int mealPlanId);
}
