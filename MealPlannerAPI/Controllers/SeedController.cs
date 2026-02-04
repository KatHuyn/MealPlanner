using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MealPlannerAPI.Data;
using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;
using System.Security.Cryptography;
using System.Text;

namespace MealPlannerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly MealPlannerDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SeedController> _logger;

    public SeedController(MealPlannerDbContext context, IWebHostEnvironment env, ILogger<SeedController> logger)
    {
        _context = context;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Khởi tạo dữ liệu mẫu cho development
    /// </summary>
    [HttpPost("init")]
    public async Task<ActionResult<ApiResponse<object>>> SeedDatabase()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "API này chỉ khả dụng trong môi trường Development"
            });
        }

        try
        {
            _logger.LogInformation("Starting database seed...");

            // Kiểm tra nếu đã có dữ liệu
            if (await _context.Products.AnyAsync())
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Dữ liệu đã tồn tại",
                    Data = new
                    {
                        Users = await _context.Users.CountAsync(),
                        Products = await _context.Products.CountAsync(),
                        Categories = await _context.Products.Select(p => p.Category).Distinct().CountAsync()
                    }
                });
            }

            // Thêm Admin User
            var adminUser = new User
            {
                FullName = "Admin MealPlanner",
                Email = "admin@mealplanner.com",
                PasswordHash = HashPassword("Admin@123"),
                Phone = "0901234567",
                IsAdmin = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(adminUser);

            // Thêm Test User
            var testUser = new User
            {
                FullName = "Nguyễn Văn Test",
                Email = "test@example.com",
                PasswordHash = HashPassword("Test@123"),
                Phone = "0987654321",
                IsAdmin = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(testUser);
            await _context.SaveChangesAsync();

            // Thêm Health Profile cho test user
            var healthProfile = new HealthProfile
            {
                UserId = testUser.Id,
                Weight = 65.5m,
                Height = 170m,
                Age = 30,
                Gender = "Male",
                ActivityLevel = "Moderate",
                Allergies = "Hải sản",
                HealthConditions = "Đau dạ dày",
                DietaryPreferences = "Ăn nhiều rau",
                Goals = "Giảm cân, Tăng sức khỏe",
                CreatedAt = DateTime.UtcNow
            };
            _context.HealthProfiles.Add(healthProfile);

            // Thêm Health Profile cho admin
            var adminHealthProfile = new HealthProfile
            {
                UserId = adminUser.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.HealthProfiles.Add(adminHealthProfile);

            // ==========================================
            // THÊM SẢN PHẨM
            // ==========================================
            var products = new List<Product>
            {
                // RAU CỦ
                new Product { Name = "Rau muống", Description = "Rau muống tươi, giòn ngọt", Price = 15000, Unit = "bó", QuantityInStock = 50, Category = "Rau củ", IsAvailable = true, Calories = 19, Protein = 2.6m, Carbs = 3.4m, Fat = 0.2m, Fiber = 2.1m, Keywords = "rau muống, morning glory, rau xanh", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Cà chua Đà Lạt", Description = "Cà chua Đà Lạt chín đỏ, ngọt", Price = 25000, Unit = "kg", QuantityInStock = 30, Category = "Rau củ", IsAvailable = true, Calories = 18, Protein = 0.9m, Carbs = 3.9m, Fat = 0.2m, Fiber = 1.2m, Keywords = "cà chua, tomato, chua", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Cà rốt", Description = "Cà rốt tươi ngọt, giàu vitamin A", Price = 20000, Unit = "kg", QuantityInStock = 40, Category = "Rau củ", IsAvailable = true, Calories = 41, Protein = 0.9m, Carbs = 9.6m, Fat = 0.2m, Fiber = 2.8m, Keywords = "cà rốt, carrot, củ", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Bông cải xanh", Description = "Bông cải xanh hữu cơ, giàu chất xơ", Price = 35000, Unit = "kg", QuantityInStock = 25, Category = "Rau củ", IsAvailable = true, Calories = 34, Protein = 2.8m, Carbs = 7, Fat = 0.4m, Fiber = 2.6m, Keywords = "bông cải xanh, broccoli, súp lơ xanh", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Bí đỏ", Description = "Bí đỏ ngọt, giàu vitamin A", Price = 18000, Unit = "kg", QuantityInStock = 35, Category = "Rau củ", IsAvailable = true, Calories = 26, Protein = 1, Carbs = 6.5m, Fat = 0.1m, Fiber = 0.5m, Keywords = "bí đỏ, pumpkin", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Khoai lang", Description = "Khoai lang mật, ngọt bùi", Price = 22000, Unit = "kg", QuantityInStock = 40, Category = "Rau củ", IsAvailable = true, Calories = 86, Protein = 1.6m, Carbs = 20, Fat = 0.1m, Fiber = 3, Keywords = "khoai lang, sweet potato", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Hành tây", Description = "Hành tây tươi, giòn", Price = 18000, Unit = "kg", QuantityInStock = 45, Category = "Rau củ", IsAvailable = true, Calories = 40, Protein = 1.1m, Carbs = 9.3m, Fat = 0.1m, Fiber = 1.7m, Keywords = "hành tây, onion, củ hành", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Xà lách", Description = "Xà lách tươi giòn", Price = 20000, Unit = "bó", QuantityInStock = 35, Category = "Rau củ", IsAvailable = true, Calories = 15, Protein = 1.4m, Carbs = 2.9m, Fat = 0.2m, Fiber = 1.3m, Keywords = "xà lách, lettuce, salad", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Dưa leo", Description = "Dưa leo tươi giòn mát", Price = 15000, Unit = "kg", QuantityInStock = 40, Category = "Rau củ", IsAvailable = true, Calories = 16, Protein = 0.7m, Carbs = 3.6m, Fat = 0.1m, Fiber = 0.5m, Keywords = "dưa leo, cucumber, dưa chuột", CreatedAt = DateTime.UtcNow },

                // GIA VỊ
                new Product { Name = "Tỏi", Description = "Tỏi Việt Nam, thơm", Price = 50000, Unit = "kg", QuantityInStock = 20, Category = "Gia vị", IsAvailable = true, Calories = 149, Protein = 6.4m, Carbs = 33, Fat = 0.5m, Fiber = 2.1m, Keywords = "tỏi, garlic", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Gừng", Description = "Gừng tươi, cay nồng", Price = 45000, Unit = "kg", QuantityInStock = 15, Category = "Gia vị", IsAvailable = true, Calories = 80, Protein = 1.8m, Carbs = 18, Fat = 0.8m, Fiber = 2, Keywords = "gừng, ginger", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Hành tím", Description = "Hành tím tươi", Price = 30000, Unit = "kg", QuantityInStock = 30, Category = "Gia vị", IsAvailable = true, Calories = 44, Protein = 1.3m, Carbs = 10, Fat = 0.1m, Fiber = 1.7m, Keywords = "hành tím, shallot", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Nước mắm Phú Quốc", Description = "Nước mắm truyền thống", Price = 55000, Unit = "chai 500ml", QuantityInStock = 40, Category = "Gia vị", IsAvailable = true, Calories = 35, Protein = 5, Carbs = 4, Fat = 0, Fiber = 0, Keywords = "nước mắm, fish sauce", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Dầu ăn Neptune", Description = "Dầu ăn cao cấp", Price = 48000, Unit = "chai 1L", QuantityInStock = 45, Category = "Gia vị", IsAvailable = true, Calories = 884, Protein = 0, Carbs = 0, Fat = 100, Fiber = 0, Keywords = "dầu ăn, cooking oil, dầu", CreatedAt = DateTime.UtcNow },

                // THỊT
                new Product { Name = "Ức gà CP", Description = "Ức gà tươi, giàu protein", Price = 85000, Unit = "kg", QuantityInStock = 30, Category = "Thịt", IsAvailable = true, Calories = 165, Protein = 31, Carbs = 0, Fat = 3.6m, Fiber = 0, Keywords = "ức gà, gà, chicken breast, thịt gà", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Thịt heo ba chỉ", Description = "Thịt heo ba chỉ tươi", Price = 95000, Unit = "kg", QuantityInStock = 25, Category = "Thịt", IsAvailable = true, Calories = 518, Protein = 9, Carbs = 0, Fat = 53, Fiber = 0, Keywords = "thịt heo, ba chỉ, pork belly, heo", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Thịt bò Úc", Description = "Thịt bò Úc nhập khẩu", Price = 280000, Unit = "kg", QuantityInStock = 15, Category = "Thịt", IsAvailable = true, Calories = 250, Protein = 26, Carbs = 0, Fat = 15, Fiber = 0, Keywords = "thịt bò, beef, bò", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Sườn non heo", Description = "Sườn non heo tươi ngon", Price = 110000, Unit = "kg", QuantityInStock = 20, Category = "Thịt", IsAvailable = true, Calories = 277, Protein = 18, Carbs = 0, Fat = 23, Fiber = 0, Keywords = "sườn non, sườn heo, pork ribs, thịt heo", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Đùi gà góc tư", Description = "Đùi gà tươi ngon", Price = 75000, Unit = "kg", QuantityInStock = 35, Category = "Thịt", IsAvailable = true, Calories = 209, Protein = 20, Carbs = 0, Fat = 14, Fiber = 0, Keywords = "đùi gà, gà, chicken thigh", CreatedAt = DateTime.UtcNow },

                // HẢI SẢN
                new Product { Name = "Cá hồi Na Uy", Description = "Cá hồi nhập khẩu, giàu omega-3", Price = 450000, Unit = "kg", QuantityInStock = 10, Category = "Hải sản", IsAvailable = true, Calories = 208, Protein = 20, Carbs = 0, Fat = 13, Fiber = 0, Keywords = "cá hồi, salmon, hồi, cá", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Tôm sú", Description = "Tôm sú tươi sống", Price = 250000, Unit = "kg", QuantityInStock = 15, Category = "Hải sản", IsAvailable = true, Calories = 99, Protein = 24, Carbs = 0.2m, Fat = 0.3m, Fiber = 0, Keywords = "tôm sú, tôm, shrimp, prawn", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Cá basa fillet", Description = "Cá basa fillet sạch", Price = 85000, Unit = "kg", QuantityInStock = 25, Category = "Hải sản", IsAvailable = true, Calories = 92, Protein = 18, Carbs = 0, Fat = 2, Fiber = 0, Keywords = "cá basa, basa, fish, cá", CreatedAt = DateTime.UtcNow },

                // TRỨNG & SỮA
                new Product { Name = "Trứng gà", Description = "Trứng gà ta tươi", Price = 35000, Unit = "chục", QuantityInStock = 50, Category = "Trứng & Sữa", IsAvailable = true, Calories = 155, Protein = 13, Carbs = 1.1m, Fat = 11, Fiber = 0, Keywords = "trứng gà, trứng, egg", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Sữa tươi TH True Milk", Description = "Sữa tươi tiệt trùng", Price = 32000, Unit = "lít", QuantityInStock = 40, Category = "Trứng & Sữa", IsAvailable = true, Calories = 62, Protein = 3.2m, Carbs = 4.8m, Fat = 3.5m, Fiber = 0, Keywords = "sữa tươi, milk, sữa", CreatedAt = DateTime.UtcNow },

                // GẠO & NGŨ CỐC
                new Product { Name = "Gạo ST25", Description = "Gạo ST25 ngon nhất thế giới", Price = 45000, Unit = "kg", QuantityInStock = 60, Category = "Gạo & Ngũ cốc", IsAvailable = true, Calories = 130, Protein = 2.7m, Carbs = 28, Fat = 0.3m, Fiber = 0.4m, Keywords = "gạo, rice, ST25, cơm", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Yến mạch Quaker", Description = "Yến mạch nguyên hạt", Price = 75000, Unit = "hộp 500g", QuantityInStock = 35, Category = "Gạo & Ngũ cốc", IsAvailable = true, Calories = 389, Protein = 17, Carbs = 66, Fat = 7, Fiber = 11, Keywords = "yến mạch, oats, oatmeal", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Bún gạo", Description = "Bún gạo khô", Price = 25000, Unit = "gói 500g", QuantityInStock = 45, Category = "Gạo & Ngũ cốc", IsAvailable = true, Calories = 364, Protein = 3.4m, Carbs = 83, Fat = 0.4m, Fiber = 1.6m, Keywords = "bún gạo, bún, rice noodle", CreatedAt = DateTime.UtcNow },

                // TRÁI CÂY
                new Product { Name = "Chuối Cavendish", Description = "Chuối nhập khẩu ngọt", Price = 35000, Unit = "nải", QuantityInStock = 40, Category = "Trái cây", IsAvailable = true, Calories = 89, Protein = 1.1m, Carbs = 23, Fat = 0.3m, Fiber = 2.6m, Keywords = "chuối, banana", CreatedAt = DateTime.UtcNow },
                new Product { Name = "Táo Envy", Description = "Táo Envy nhập khẩu", Price = 95000, Unit = "kg", QuantityInStock = 25, Category = "Trái cây", IsAvailable = true, Calories = 52, Protein = 0.3m, Carbs = 14, Fat = 0.2m, Fiber = 2.4m, Keywords = "táo, apple", CreatedAt = DateTime.UtcNow },

                // ĐẬU & HẠT
                new Product { Name = "Đậu phụ non", Description = "Đậu phụ non mịn", Price = 15000, Unit = "miếng", QuantityInStock = 40, Category = "Đậu & Hạt", IsAvailable = true, Calories = 76, Protein = 8, Carbs = 2, Fat = 4.8m, Fiber = 0.3m, Keywords = "đậu phụ, tofu, đậu hũ", CreatedAt = DateTime.UtcNow },
            };

            _context.Products.AddRange(products);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Database seed completed successfully");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Khởi tạo dữ liệu mẫu thành công!",
                Data = new
                {
                    Users = await _context.Users.CountAsync(),
                    Products = await _context.Products.CountAsync(),
                    Categories = await _context.Products.Select(p => p.Category).Distinct().ToListAsync(),
                    TestAccount = new
                    {
                        Email = "test@example.com",
                        Password = "Test@123"
                    },
                    AdminAccount = new
                    {
                        Email = "admin@mealplanner.com",
                        Password = "Admin@123"
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding database");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi khởi tạo dữ liệu",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Xóa toàn bộ dữ liệu (Development only)
    /// </summary>
    [HttpDelete("clear")]
    public async Task<ActionResult<ApiResponse<object>>> ClearDatabase()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "API này chỉ khả dụng trong môi trường Development"
            });
        }

        try
        {
            // Xóa dữ liệu theo thứ tự đảm bảo không vi phạm foreign key
            _context.OrderItems.RemoveRange(_context.OrderItems);
            _context.Orders.RemoveRange(_context.Orders);
            _context.MealPlanIngredients.RemoveRange(_context.MealPlanIngredients);
            _context.Meals.RemoveRange(_context.Meals);
            _context.MealPlans.RemoveRange(_context.MealPlans);
            _context.ChatHistories.RemoveRange(_context.ChatHistories);
            _context.Products.RemoveRange(_context.Products);
            _context.HealthProfiles.RemoveRange(_context.HealthProfiles);
            _context.Users.RemoveRange(_context.Users);

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Đã xóa toàn bộ dữ liệu"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Sửa đơn vị sản phẩm cho đúng (Development only)
    /// </summary>
    [HttpPost("fix-units")]
    public async Task<ActionResult<ApiResponse<object>>> FixProductUnits()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "API này chỉ khả dụng trong môi trường Development"
            });
        }

        try
        {
            var updates = new List<object>();

            // Fix Trứng gà: vỉ -> chục
            var eggs = await _context.Products
                .Where(p => p.Keywords != null && p.Keywords.Contains("trứng"))
                .ToListAsync();
            foreach (var egg in eggs)
            {
                egg.Unit = "chục";
                egg.Name = egg.Name.Contains("10 quả") ? egg.Name.Replace("10 quả", "").Trim() : egg.Name;
                if (!egg.Name.Contains("Trứng gà")) egg.Name = "Trứng gà";
                updates.Add(new { egg.Id, egg.Name, egg.Unit, egg.Price });
            }

            // Fix Sữa: hộp -> lít
            var milk = await _context.Products
                .Where(p => p.Keywords != null && p.Keywords.Contains("sữa"))
                .ToListAsync();
            foreach (var m in milk)
            {
                if (m.Unit == "hộp")
                {
                    m.Unit = "lít";
                    updates.Add(new { m.Id, m.Name, m.Unit, m.Price });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = $"Đã cập nhật {updates.Count} sản phẩm",
                Data = updates
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Kiểm tra dữ liệu trong database
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetStats()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "API này chỉ khả dụng trong môi trường Development"
            });
        }

        var users = await _context.Users.ToListAsync();
        var products = await _context.Products.ToListAsync();
        var mealPlans = await _context.MealPlans.ToListAsync();
        var meals = await _context.Meals.ToListAsync();

        // Tìm duplicates
        var duplicateUsers = users.GroupBy(u => u.Email)
            .Where(g => g.Count() > 1)
            .Select(g => new { Email = g.Key, Count = g.Count() })
            .ToList();

        var duplicateProducts = products.GroupBy(p => p.Name)
            .Where(g => g.Count() > 1)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .ToList();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Thống kê database",
            Data = new
            {
                TotalUsers = users.Count,
                TotalProducts = products.Count,
                TotalMealPlans = mealPlans.Count,
                TotalMeals = meals.Count,
                DuplicateUsers = duplicateUsers,
                DuplicateProducts = duplicateProducts,
                Users = users.Select(u => new { u.Id, u.Email, u.FullName, u.IsAdmin }).ToList()
            }
        });
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Set user as admin (Development only)
    /// </summary>
    [HttpPost("make-admin")]
    public async Task<ActionResult<ApiResponse<object>>> MakeAdmin([FromBody] MakeAdminRequest request)
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "API này chỉ khả dụng trong môi trường Development"
            });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Không tìm thấy user"
            });
        }

        user.IsAdmin = true;
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"Đã set {user.Email} thành Admin!",
            Data = new { user.Id, user.Email, user.IsAdmin }
        });
    }

    public class MakeAdminRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Import sản phẩm từ file JSON (Development only)
    /// </summary>
    [HttpPost("import-products")]
    public async Task<ActionResult<ApiResponse<object>>> ImportProductsFromJson()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "API này chỉ khả dụng trong môi trường Development"
            });
        }

        try
        {
            var jsonPath = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "vietnamese_foods.json");
            
            if (!System.IO.File.Exists(jsonPath))
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = $"File not found: {jsonPath}"
                });
            }

            var jsonContent = await System.IO.File.ReadAllTextAsync(jsonPath, Encoding.UTF8);
            var foodData = System.Text.Json.JsonSerializer.Deserialize<FoodDataJson>(jsonContent, new System.Text.Json.JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (foodData?.Categories == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid JSON format"
                });
            }

            // Clear existing products
            _context.Products.RemoveRange(_context.Products);
            await _context.SaveChangesAsync();

            var products = new List<Product>();
            var now = DateTime.UtcNow;

            // Image URLs by category and keywords
            var categoryImages = new Dictionary<string, string>
            {
                { "Thịt", "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400" },
                { "Hải sản", "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400" },
                { "Rau củ", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400" },
                { "Trái cây", "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400" },
                { "Đậu & Hạt", "https://images.unsplash.com/photo-1515543904323-e75fcfda815f?w=400" },
                { "Gia vị", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
                { "Tinh bột", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
                { "Trứng & Sữa", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" }
            };

            // Specific images for common products
            var productImages = new Dictionary<string, string>
            {
                // Thịt
                { "Ức gà", "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400" },
                { "Đùi gà", "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400" },
                { "Thịt bò", "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400" },
                { "Thịt ba rọi heo", "https://images.unsplash.com/photo-1623174479786-7a4b53c2a3cc?w=400" },
                { "Sườn heo", "https://images.unsplash.com/photo-1544025162-d76694265947?w=400" },
                // Hải sản
                { "Cá hồi", "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400" },
                { "Tôm", "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400" },
                { "Cá basa phi lê", "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400" },
                { "Mực", "https://images.unsplash.com/photo-1590759668628-05b0fc34bb70?w=400" },
                // Rau củ
                { "Cà chua", "https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400" },
                { "Cà rốt", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400" },
                { "Bông cải xanh", "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400" },
                { "Rau muống", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400" },
                { "Xà lách", "https://images.unsplash.com/photo-1622206151241-fcf8b72e67fb?w=400" },
                { "Dưa leo", "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400" },
                { "Hành tây", "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400" },
                { "Khoai tây", "https://images.unsplash.com/photo-1518977676601-b53f82ber41c?w=400" },
                // Trái cây  
                { "Chuối", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400" },
                { "Cam", "https://images.unsplash.com/photo-1547514701-42782101795e?w=400" },
                { "Táo", "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400" },
                { "Xoài", "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400" },
                { "Dưa hấu", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400" },
                // Gia vị
                { "Tỏi", "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400" },
                { "Gừng", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400" },
                { "Ớt", "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400" },
                { "Sả", "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400" },
                { "Hành tím", "https://images.unsplash.com/photo-1518977676601-b53f82ber41c?w=400" },
                // Tinh bột
                { "Gạo trắng", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
                { "Bún tươi", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400" },
                { "Mì", "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
                { "Yến mạch", "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400" },
                // Trứng & Sữa
                { "Trứng gà", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },
                { "Sữa tươi", "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
                // Đậu & Hạt
                { "Đậu phụ", "https://images.unsplash.com/photo-1584949091598-c31daaaa4aa9?w=400" },
                { "Đậu đen", "https://images.unsplash.com/photo-1515543904323-e75fcfda815f?w=400" },
                { "Đậu đỏ", "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=400" }
            };

            foreach (var category in foodData.Categories)
            {
                foreach (var item in category.Items)
                {
                    // Find best matching image
                    string imageUrl = categoryImages.GetValueOrDefault(category.Name, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400");
                    
                    // Try to find specific product image
                    foreach (var productImage in productImages)
                    {
                        if (item.Name.Contains(productImage.Key, StringComparison.OrdinalIgnoreCase))
                        {
                            imageUrl = productImage.Value;
                            break;
                        }
                    }

                    products.Add(new Product
                    {
                        Name = item.Name,
                        Category = category.Name,
                        Price = item.Price,
                        Unit = item.Unit,
                        QuantityInStock = 100,
                        Calories = (int)item.Calories,
                        Protein = item.Protein,
                        Carbs = item.Carbs,
                        Fat = item.Fat,
                        Keywords = item.Keywords,
                        ImageUrl = imageUrl,
                        IsAvailable = true,
                        CreatedAt = now
                    });
                }
            }

            _context.Products.AddRange(products);
            await _context.SaveChangesAsync();

            var categories = products.GroupBy(p => p.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToList();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = $"Đã import {products.Count} sản phẩm thành công!",
                Data = new
                {
                    TotalProducts = products.Count,
                    Categories = categories
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing products from JSON");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi import sản phẩm",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}

// DTO classes for JSON parsing
public class FoodDataJson
{
    public List<FoodCategoryJson>? Categories { get; set; }
}

public class FoodCategoryJson
{
    public string Name { get; set; } = string.Empty;
    public List<FoodItemJson> Items { get; set; } = new();
}

public class FoodItemJson
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Calories { get; set; }
    public decimal Protein { get; set; }
    public decimal Carbs { get; set; }
    public decimal Fat { get; set; }
    public string Keywords { get; set; } = string.Empty;
}
