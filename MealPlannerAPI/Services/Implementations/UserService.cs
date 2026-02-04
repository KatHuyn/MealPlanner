using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MealPlannerAPI.Data;
using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services.Implementations;

public class UserService : IUserService
{
    private readonly MealPlannerDbContext _context;
    private readonly IConfiguration _configuration;

    public UserService(MealPlannerDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ApiResponse<LoginResponse>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Email đã được sử dụng"
                };
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                Phone = request.Phone,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create default health profile
            var healthProfile = new HealthProfile
            {
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.HealthProfiles.Add(healthProfile);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            var userDto = MapToUserDto(user);

            return new ApiResponse<LoginResponse>
            {
                Success = true,
                Message = "Đăng ký thành công",
                Data = new LoginResponse
                {
                    Token = token,
                    User = userDto
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi đăng ký",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.HealthProfile)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Email hoặc mật khẩu không chính xác"
                };
            }

            var token = GenerateJwtToken(user);
            var userDto = MapToUserDto(user);

            return new ApiResponse<LoginResponse>
            {
                Success = true,
                Message = "Đăng nhập thành công",
                Data = new LoginResponse
                {
                    Token = token,
                    User = userDto
                }
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi đăng nhập",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(int userId)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.HealthProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Không tìm thấy người dùng"
                };
            }

            return new ApiResponse<UserDto>
            {
                Success = true,
                Data = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<UserDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<HealthProfileDto>> GetHealthProfileAsync(int userId)
    {
        try
        {
            var profile = await _context.HealthProfiles
                .FirstOrDefaultAsync(h => h.UserId == userId);

            if (profile == null)
            {
                return new ApiResponse<HealthProfileDto>
                {
                    Success = false,
                    Message = "Không tìm thấy hồ sơ sức khỏe"
                };
            }

            return new ApiResponse<HealthProfileDto>
            {
                Success = true,
                Data = MapToHealthProfileDto(profile)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<HealthProfileDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<HealthProfileDto>> UpdateHealthProfileAsync(int userId, UpdateHealthProfileRequest request)
    {
        try
        {
            var profile = await _context.HealthProfiles
                .FirstOrDefaultAsync(h => h.UserId == userId);

            if (profile == null)
            {
                profile = new HealthProfile
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.HealthProfiles.Add(profile);
            }

            profile.Weight = request.Weight ?? profile.Weight;
            profile.Height = request.Height ?? profile.Height;
            profile.Age = request.Age ?? profile.Age;
            profile.Gender = request.Gender ?? profile.Gender;
            profile.ActivityLevel = request.ActivityLevel ?? profile.ActivityLevel;
            profile.Allergies = request.Allergies ?? profile.Allergies;
            profile.HealthConditions = request.HealthConditions ?? profile.HealthConditions;
            profile.DietaryPreferences = request.DietaryPreferences ?? profile.DietaryPreferences;
            profile.Goals = request.Goals ?? profile.Goals;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new ApiResponse<HealthProfileDto>
            {
                Success = true,
                Message = "Cập nhật hồ sơ sức khỏe thành công",
                Data = MapToHealthProfileDto(profile)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<HealthProfileDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi cập nhật",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim("IsAdmin", user.IsAdmin.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            IsAdmin = user.IsAdmin,
            HealthProfile = user.HealthProfile != null ? MapToHealthProfileDto(user.HealthProfile) : null
        };
    }

    private static HealthProfileDto MapToHealthProfileDto(HealthProfile profile)
    {
        return new HealthProfileDto
        {
            Id = profile.Id,
            Weight = profile.Weight,
            Height = profile.Height,
            Age = profile.Age,
            Gender = profile.Gender,
            ActivityLevel = profile.ActivityLevel,
            Allergies = profile.Allergies,
            HealthConditions = profile.HealthConditions,
            DietaryPreferences = profile.DietaryPreferences,
            Goals = profile.Goals
        };
    }
}
