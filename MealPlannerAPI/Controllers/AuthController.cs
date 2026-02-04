using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MealPlannerAPI.Models.DTOs;
using MealPlannerAPI.Services;

namespace MealPlannerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Đăng ký tài khoản mới
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] RegisterRequest request)
    {
        var result = await _userService.RegisterAsync(request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Đăng nhập
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var result = await _userService.LoginAsync(request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin người dùng hiện tại
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        var userId = GetUserId();
        var result = await _userService.GetUserByIdAsync(userId);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Lấy hồ sơ sức khỏe
    /// </summary>
    [Authorize]
    [HttpGet("health-profile")]
    public async Task<ActionResult<ApiResponse<HealthProfileDto>>> GetHealthProfile()
    {
        var userId = GetUserId();
        var result = await _userService.GetHealthProfileAsync(userId);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật hồ sơ sức khỏe
    /// </summary>
    [Authorize]
    [HttpPut("health-profile")]
    public async Task<ActionResult<ApiResponse<HealthProfileDto>>> UpdateHealthProfile([FromBody] UpdateHealthProfileRequest request)
    {
        var userId = GetUserId();
        var result = await _userService.UpdateHealthProfileAsync(userId, request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
}
