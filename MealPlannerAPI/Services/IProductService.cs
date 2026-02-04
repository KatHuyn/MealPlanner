using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services;

public interface IProductService
{
    Task<ApiResponse<List<ProductDto>>> GetAllProductsAsync(string? category = null, bool? availableOnly = true);
    Task<ApiResponse<ProductDto>> GetProductByIdAsync(int productId);
    Task<ApiResponse<ProductDto>> CreateProductAsync(CreateProductRequest request);
    Task<ApiResponse<ProductDto>> UpdateProductAsync(int productId, CreateProductRequest request);
    Task<ApiResponse<bool>> DeleteProductAsync(int productId);
    Task<ApiResponse<List<string>>> GetCategoriesAsync();
    Task<List<Product>> SearchProductsByKeywordsAsync(string keyword);
}
