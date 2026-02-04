using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services;

public interface IUserService
{
    Task<ApiResponse<LoginResponse>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<UserDto>> GetUserByIdAsync(int userId);
    Task<ApiResponse<HealthProfileDto>> GetHealthProfileAsync(int userId);
    Task<ApiResponse<HealthProfileDto>> UpdateHealthProfileAsync(int userId, UpdateHealthProfileRequest request);
}
