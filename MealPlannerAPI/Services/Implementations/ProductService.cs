using Microsoft.EntityFrameworkCore;
using MealPlannerAPI.Data;
using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services.Implementations;

public class ProductService : IProductService
{
    private readonly MealPlannerDbContext _context;

    public ProductService(MealPlannerDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<ProductDto>>> GetAllProductsAsync(string? category = null, bool? availableOnly = true)
    {
        try
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category == category);
            }

            if (availableOnly == true)
            {
                query = query.Where(p => p.IsAvailable && p.QuantityInStock > 0);
            }

            var products = await query
                .OrderBy(p => p.Category)
                .ThenBy(p => p.Name)
                .Select(p => MapToProductDto(p))
                .ToListAsync();

            return new ApiResponse<List<ProductDto>>
            {
                Success = true,
                Data = products
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProductDto>>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi lấy danh sách sản phẩm",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<ProductDto>> GetProductByIdAsync(int productId)
    {
        try
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return new ApiResponse<ProductDto>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm"
                };
            }

            return new ApiResponse<ProductDto>
            {
                Success = true,
                Data = MapToProductDto(product)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProductDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<ProductDto>> CreateProductAsync(CreateProductRequest request)
    {
        try
        {
            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                Unit = request.Unit,
                QuantityInStock = request.QuantityInStock,
                Category = request.Category,
                ImageUrl = request.ImageUrl,
                Calories = request.Calories,
                Protein = request.Protein,
                Carbs = request.Carbs,
                Fat = request.Fat,
                Fiber = request.Fiber,
                Keywords = request.Keywords,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return new ApiResponse<ProductDto>
            {
                Success = true,
                Message = "Tạo sản phẩm thành công",
                Data = MapToProductDto(product)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProductDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi tạo sản phẩm",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<ProductDto>> UpdateProductAsync(int productId, CreateProductRequest request)
    {
        try
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return new ApiResponse<ProductDto>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm"
                };
            }

            product.Name = request.Name;
            product.Description = request.Description;
            product.Price = request.Price;
            product.Unit = request.Unit;
            product.QuantityInStock = request.QuantityInStock;
            product.Category = request.Category;
            product.ImageUrl = request.ImageUrl;
            product.Calories = request.Calories;
            product.Protein = request.Protein;
            product.Carbs = request.Carbs;
            product.Fat = request.Fat;
            product.Fiber = request.Fiber;
            product.Keywords = request.Keywords;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new ApiResponse<ProductDto>
            {
                Success = true,
                Message = "Cập nhật sản phẩm thành công",
                Data = MapToProductDto(product)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProductDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi cập nhật sản phẩm",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<bool>> DeleteProductAsync(int productId)
    {
        try
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm"
                };
            }

            // Soft delete - just mark as unavailable
            product.IsAvailable = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Xóa sản phẩm thành công",
                Data = true
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi xóa sản phẩm",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<List<string>>> GetCategoriesAsync()
    {
        try
        {
            var categories = await _context.Products
                .Where(p => !string.IsNullOrEmpty(p.Category))
                .Select(p => p.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return new ApiResponse<List<string>>
            {
                Success = true,
                Data = categories
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<string>>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<List<Product>> SearchProductsByKeywordsAsync(string keyword)
    {
        keyword = keyword.ToLower().Trim();

        return await _context.Products
            .Where(p => p.IsAvailable && p.QuantityInStock > 0)
            .Where(p => 
                p.Name.ToLower().Contains(keyword) ||
                (p.Keywords != null && p.Keywords.ToLower().Contains(keyword)))
            .ToListAsync();
    }

    private static ProductDto MapToProductDto(Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            Unit = product.Unit,
            QuantityInStock = product.QuantityInStock,
            Category = product.Category,
            ImageUrl = product.ImageUrl,
            IsAvailable = product.IsAvailable,
            Calories = product.Calories,
            Protein = product.Protein,
            Carbs = product.Carbs,
            Fat = product.Fat
        };
    }
}
