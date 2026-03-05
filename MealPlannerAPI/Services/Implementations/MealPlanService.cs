using Microsoft.EntityFrameworkCore;
using MealPlannerAPI.Data;
using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services.Implementations;

public class MealPlanService : IMealPlanService
{
    private readonly MealPlannerDbContext _context;
    private readonly IAIService _aiService;
    private readonly IProductService _productService;
    private readonly ILogger<MealPlanService> _logger;

    public MealPlanService(
        MealPlannerDbContext context,
        IAIService aiService,
        IProductService productService,
        ILogger<MealPlanService> logger)
    {
        _context = context;
        _aiService = aiService;
        _productService = productService;
        _logger = logger;
    }

    public async Task<ApiResponse<MealPlanDto>> GenerateMealPlanAsync(int userId, string userRequest)
    {
        try
        {
            // 1. Lấy thông tin sức khỏe của user
            var healthProfile = await _context.HealthProfiles
                .FirstOrDefaultAsync(h => h.UserId == userId);

            // 2. Lấy danh sách nguyên liệu có sẵn trong kho
            var availableProducts = await _context.Products
                .Where(p => p.IsAvailable && p.QuantityInStock > 0)
                .Select(p => p.Name)
                .ToListAsync();

            // 3. Chuẩn bị request cho AI
            var aiRequest = new AIMealPlanRequest
            {
                UserRequest = userRequest,
                AvailableIngredients = availableProducts,
                HealthProfile = healthProfile != null ? new HealthProfileDto
                {
                    Weight = healthProfile.Weight,
                    Height = healthProfile.Height,
                    Age = healthProfile.Age,
                    Gender = healthProfile.Gender,
                    ActivityLevel = healthProfile.ActivityLevel,
                    Allergies = healthProfile.Allergies,
                    HealthConditions = healthProfile.HealthConditions,
                    DietaryPreferences = healthProfile.DietaryPreferences,
                    Goals = healthProfile.Goals
                } : null,
                Allergies = healthProfile?.Allergies?.Split(',').Select(a => a.Trim()).ToList(),
                HealthConditions = healthProfile?.HealthConditions?.Split(',').Select(h => h.Trim()).ToList(),
                DietaryPreferences = healthProfile?.DietaryPreferences
            };

            // 4. Gọi AI để tạo thực đơn
            var aiResponse = await _aiService.GenerateMealPlanAsync(aiRequest);

            if (aiResponse == null)
            {
                return new ApiResponse<MealPlanDto>
                {
                    Success = false,
                    Message = "Không thể tạo thực đơn. Vui lòng thử lại."
                };
            }

            // AI rejected the request (non-food related or invalid)
            if (!aiResponse.Meals.Any())
            {
                return new ApiResponse<MealPlanDto>
                {
                    Success = false,
                    Message = aiResponse.Message ?? "Yêu cầu không liên quan đến thực đơn. Vui lòng nhập yêu cầu về ăn uống hoặc dinh dưỡng."
                };
            }

            // 5. Lưu thực đơn vào database
            var mealPlan = new MealPlan
            {
                UserId = userId,
                UserRequest = userRequest,
                PlanDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };

            _context.MealPlans.Add(mealPlan);
            await _context.SaveChangesAsync();

            // 6. Lưu các bữa ăn và mapping nguyên liệu
            foreach (var aiMeal in aiResponse.Meals)
            {
                var meal = new Meal
                {
                    MealPlanId = mealPlan.Id,
                    MealType = ParseMealType(aiMeal.MealType),
                    DishName = aiMeal.DishName,
                    Recipe = aiMeal.Recipe,
                    Description = aiMeal.Description,
                    PrepTime = aiMeal.PrepTime,
                    CookTime = aiMeal.CookTime,
                    Servings = aiMeal.Servings,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Meals.Add(meal);
                await _context.SaveChangesAsync();

                // 7. Mapping nguyên liệu với sản phẩm trong kho
                foreach (var aiIngredient in aiMeal.Ingredients)
                {
                    var matchedProducts = await _productService.SearchProductsByKeywordsAsync(aiIngredient.Name);
                    var matchedProduct = matchedProducts.FirstOrDefault();

                    var ingredient = new MealPlanIngredient
                    {
                        MealId = meal.Id,
                        IngredientName = aiIngredient.Name,
                        Quantity = aiIngredient.Quantity,
                        Unit = aiIngredient.Unit,
                        Notes = aiIngredient.Notes,
                        ProductId = matchedProduct?.Id,
                        IsMatched = matchedProduct != null
                    };

                    _context.MealPlanIngredients.Add(ingredient);
                }

                await _context.SaveChangesAsync();
            }

            // 8. Lưu lịch sử chat
            var chatHistory = new ChatHistory
            {
                UserId = userId,
                UserMessage = userRequest,
                AiResponse = $"Đã tạo thực đơn với {aiResponse.Meals.Count} bữa ăn",
                MealPlanId = mealPlan.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatHistories.Add(chatHistory);
            await _context.SaveChangesAsync();

            // 9. Trả về kết quả
            return await GetMealPlanByIdAsync(mealPlan.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating meal plan for user {UserId}", userId);
            return new ApiResponse<MealPlanDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi tạo thực đơn",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<MealPlanDto>> GetMealPlanByIdAsync(int mealPlanId)
    {
        try
        {
            var mealPlan = await _context.MealPlans
                .Include(mp => mp.Meals)
                    .ThenInclude(m => m.Ingredients)
                        .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(mp => mp.Id == mealPlanId);

            if (mealPlan == null)
            {
                return new ApiResponse<MealPlanDto>
                {
                    Success = false,
                    Message = "Không tìm thấy thực đơn"
                };
            }

            var dto = MapToMealPlanDto(mealPlan);

            return new ApiResponse<MealPlanDto>
            {
                Success = true,
                Data = dto
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<MealPlanDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<List<MealPlanDto>>> GetUserMealPlansAsync(int userId, int page = 1, int pageSize = 10)
    {
        try
        {
            var mealPlans = await _context.MealPlans
                .Where(mp => mp.UserId == userId)
                .OrderByDescending(mp => mp.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(mp => mp.Meals)
                    .ThenInclude(m => m.Ingredients)
                        .ThenInclude(i => i.Product)
                .ToListAsync();

            var dtos = mealPlans.Select(MapToMealPlanDto).ToList();

            return new ApiResponse<List<MealPlanDto>>
            {
                Success = true,
                Data = dtos
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<MealPlanDto>>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<MealPlanDto>> RegenerateMealAsync(int mealPlanId, int mealId)
    {
        try
        {
            var mealPlan = await _context.MealPlans
                .Include(mp => mp.Meals)
                .FirstOrDefaultAsync(mp => mp.Id == mealPlanId);

            if (mealPlan == null)
            {
                return new ApiResponse<MealPlanDto>
                {
                    Success = false,
                    Message = "Không tìm thấy thực đơn"
                };
            }

            var meal = mealPlan.Meals.FirstOrDefault(m => m.Id == mealId);
            if (meal == null)
            {
                return new ApiResponse<MealPlanDto>
                {
                    Success = false,
                    Message = "Không tìm thấy bữa ăn"
                };
            }

            // Regenerate using AI with specific request
            var userRequest = $"Đổi công thức bữa {meal.MealType} khác với {meal.DishName}. Yêu cầu gốc: {mealPlan.UserRequest}";
            
            // Get health profile
            var healthProfile = await _context.HealthProfiles
                .FirstOrDefaultAsync(h => h.UserId == mealPlan.UserId);

            var availableProducts = await _context.Products
                .Where(p => p.IsAvailable && p.QuantityInStock > 0)
                .Select(p => p.Name)
                .ToListAsync();

            var aiRequest = new AIMealPlanRequest
            {
                UserRequest = userRequest,
                AvailableIngredients = availableProducts,
                HealthProfile = healthProfile != null ? new HealthProfileDto
                {
                    Allergies = healthProfile.Allergies,
                    HealthConditions = healthProfile.HealthConditions
                } : null
            };

            var aiResponse = await _aiService.GenerateMealPlanAsync(aiRequest);
            var newMealData = aiResponse?.Meals.FirstOrDefault(m => 
                ParseMealType(m.MealType) == meal.MealType);

            if (newMealData == null)
            {
                return new ApiResponse<MealPlanDto>
                {
                    Success = false,
                    Message = "Không thể tạo công thức mới"
                };
            }

            // Delete old ingredients
            var oldIngredients = await _context.MealPlanIngredients
                .Where(i => i.MealId == mealId)
                .ToListAsync();
            _context.MealPlanIngredients.RemoveRange(oldIngredients);

            // Update meal
            meal.DishName = newMealData.DishName;
            meal.Recipe = newMealData.Recipe;
            meal.Description = newMealData.Description;
            meal.PrepTime = newMealData.PrepTime;
            meal.CookTime = newMealData.CookTime;

            await _context.SaveChangesAsync();

            // Add new ingredients with mapping
            foreach (var aiIngredient in newMealData.Ingredients)
            {
                var matchedProducts = await _productService.SearchProductsByKeywordsAsync(aiIngredient.Name);
                var matchedProduct = matchedProducts.FirstOrDefault();

                var ingredient = new MealPlanIngredient
                {
                    MealId = meal.Id,
                    IngredientName = aiIngredient.Name,
                    Quantity = aiIngredient.Quantity,
                    Unit = aiIngredient.Unit,
                    Notes = aiIngredient.Notes,
                    ProductId = matchedProduct?.Id,
                    IsMatched = matchedProduct != null
                };

                _context.MealPlanIngredients.Add(ingredient);
            }

            await _context.SaveChangesAsync();

            return await GetMealPlanByIdAsync(mealPlanId);
        }
        catch (Exception ex)
        {
            return new ApiResponse<MealPlanDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi đổi công thức",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<bool>> DeleteMealPlanAsync(int mealPlanId)
    {
        try
        {
            var mealPlan = await _context.MealPlans.FindAsync(mealPlanId);
            
            if (mealPlan == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Không tìm thấy thực đơn"
                };
            }

            _context.MealPlans.Remove(mealPlan);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Xóa thực đơn thành công",
                Data = true
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    private static MealType ParseMealType(string mealType)
    {
        return mealType.ToLower() switch
        {
            "breakfast" or "sáng" or "bữa sáng" => MealType.Breakfast,
            "lunch" or "trưa" or "bữa trưa" => MealType.Lunch,
            "dinner" or "tối" or "bữa tối" => MealType.Dinner,
            "snack" or "phụ" or "bữa phụ" => MealType.Snack,
            _ => MealType.Lunch
        };
    }

    private static MealPlanDto MapToMealPlanDto(MealPlan mealPlan)
    {
        decimal totalCost = 0;
        var meals = mealPlan.Meals.Select(m =>
        {
            var mealDto = new MealDto
            {
                Id = m.Id,
                MealType = m.MealType.ToString(),
                DishName = m.DishName,
                Recipe = m.Recipe,
                Description = m.Description,
                ImageUrl = m.ImageUrl,
                PrepTime = m.PrepTime,
                CookTime = m.CookTime,
                Servings = m.Servings,
                TotalCalories = m.TotalCalories,
                TotalProtein = m.TotalProtein,
                TotalCarbs = m.TotalCarbs,
                TotalFat = m.TotalFat,
                Ingredients = m.Ingredients.Select(i =>
                {
                    // Tính giá nguyên liệu nếu có sản phẩm tương ứng
                    if (i.Product != null)
                    {
                        // Sử dụng helper để tính giá (tự động quy đổi gram -> kg)
                        totalCost += Helpers.UnitConverter.CalculatePrice(
                            i.Product.Price, 
                            i.Product.Unit, 
                            i.Quantity, 
                            i.Unit
                        );
                    }

                    return new IngredientDto
                    {
                        Id = i.Id,
                        IngredientName = i.IngredientName,
                        Quantity = i.Quantity,
                        Unit = i.Unit,
                        Notes = i.Notes,
                        IsMatched = i.IsMatched,
                        Product = i.Product != null ? new ProductDto
                        {
                            Id = i.Product.Id,
                            Name = i.Product.Name,
                            Price = i.Product.Price,
                            Unit = i.Product.Unit,
                            ImageUrl = i.Product.ImageUrl,
                            IsAvailable = i.Product.IsAvailable
                        } : null
                    };
                }).ToList()
            };
            return mealDto;
        }).ToList();

        return new MealPlanDto
        {
            Id = mealPlan.Id,
            UserRequest = mealPlan.UserRequest,
            PlanDate = mealPlan.PlanDate,
            Meals = meals,
            TotalCost = totalCost
        };
    }

    public async Task<ApiResponse<IngredientDto>> SwapIngredientAsync(int ingredientId, SwapIngredientRequest request)
    {
        try
        {
            var ingredient = await _context.MealPlanIngredients
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.Id == ingredientId);

            if (ingredient == null)
            {
                return new ApiResponse<IngredientDto>
                {
                    Success = false,
                    Message = "Không tìm thấy nguyên liệu"
                };
            }

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return new ApiResponse<IngredientDto>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm"
                };
            }

            ingredient.ProductId = request.ProductId;
            ingredient.IngredientName = request.ProductName;
            ingredient.Quantity = request.Quantity;
            ingredient.Unit = request.Unit;
            ingredient.IsMatched = true;

            await _context.SaveChangesAsync();

            // Reload product navigation property
            await _context.Entry(ingredient).Reference(i => i.Product).LoadAsync();

            return new ApiResponse<IngredientDto>
            {
                Success = true,
                Message = "Đã đổi nguyên liệu thành công",
                Data = MapToIngredientDto(ingredient)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error swapping ingredient {IngredientId}", ingredientId);
            return new ApiResponse<IngredientDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<bool>> DeleteIngredientAsync(int ingredientId)
    {
        try
        {
            var ingredient = await _context.MealPlanIngredients.FindAsync(ingredientId);

            if (ingredient == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Không tìm thấy nguyên liệu"
                };
            }

            _context.MealPlanIngredients.Remove(ingredient);
            await _context.SaveChangesAsync();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Đã xóa nguyên liệu thành công",
                Data = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ingredient {IngredientId}", ingredientId);
            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<IngredientDto>> AddIngredientAsync(int mealId, AddIngredientRequest request)
    {
        try
        {
            var meal = await _context.Meals.FindAsync(mealId);
            if (meal == null)
            {
                return new ApiResponse<IngredientDto>
                {
                    Success = false,
                    Message = "Không tìm thấy bữa ăn"
                };
            }

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return new ApiResponse<IngredientDto>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm"
                };
            }

            var ingredient = new MealPlanIngredient
            {
                MealId = mealId,
                ProductId = product.Id,
                IngredientName = product.Name,
                Quantity = request.Quantity,
                Unit = request.Unit,
                IsMatched = true
            };

            _context.MealPlanIngredients.Add(ingredient);
            await _context.SaveChangesAsync();

            // Load product navigation
            await _context.Entry(ingredient).Reference(i => i.Product).LoadAsync();

            return new ApiResponse<IngredientDto>
            {
                Success = true,
                Message = "Đã thêm nguyên liệu thành công",
                Data = MapToIngredientDto(ingredient)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding ingredient to meal {MealId}", mealId);
            return new ApiResponse<IngredientDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    private static IngredientDto MapToIngredientDto(MealPlanIngredient i)
    {
        return new IngredientDto
        {
            Id = i.Id,
            IngredientName = i.IngredientName,
            Quantity = i.Quantity,
            Unit = i.Unit,
            Notes = i.Notes,
            IsMatched = i.IsMatched,
            Product = i.Product != null ? new ProductDto
            {
                Id = i.Product.Id,
                Name = i.Product.Name,
                Price = i.Product.Price,
                Unit = i.Product.Unit,
                ImageUrl = i.Product.ImageUrl,
                IsAvailable = i.Product.IsAvailable
            } : null
        };
    }
}
