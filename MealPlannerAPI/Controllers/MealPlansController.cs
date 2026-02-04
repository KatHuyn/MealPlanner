using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MealPlannerAPI.Models.DTOs;
using MealPlannerAPI.Services;

namespace MealPlannerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MealPlansController : ControllerBase
{
    private readonly IMealPlanService _mealPlanService;
    private readonly IAIService _aiService;

    public MealPlansController(IMealPlanService mealPlanService, IAIService aiService)
    {
        _mealPlanService = mealPlanService;
        _aiService = aiService;
    }

    /// <summary>
    /// Tạo thực đơn mới dựa trên yêu cầu của người dùng
    /// </summary>
    /// <remarks>
    /// Ví dụ yêu cầu:
    /// - "Tôi bị đau bao tử, hãy lên thực đơn 3 bữa nhẹ nhàng"
    /// - "Tôi muốn tăng cơ"
    /// - "Lên thực đơn giảm cân cho tôi"
    /// </remarks>
    [HttpPost("generate")]
    public async Task<ActionResult<ApiResponse<MealPlanDto>>> GenerateMealPlan([FromBody] ChatRequest request)
    {
        var userId = GetUserId();
        var result = await _mealPlanService.GenerateMealPlanAsync(userId, request.Message);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Chatbot bán hàng sáng tạo với Function Calling
    /// Gemini sẽ tự kiểm tra tồn kho và sáng tạo công thức
    /// </summary>
    /// <remarks>
    /// Ví dụ yêu cầu:
    /// - "Nhà còn mỗi trứng vịt, nấu gì ngon mà nhanh nhỉ?"
    /// - "Thịt bò có những loại nào?"
    /// - "Gợi ý món ăn nhanh với nguyên liệu dưới 50k"
    /// </remarks>
    [HttpPost("sales-chat")]
    [AllowAnonymous] // Cho phép test không cần đăng nhập
    public async Task<ActionResult<SalesChatResponse>> SalesChat([FromBody] SalesChatRequest request)
    {
        var result = await _aiService.SalesChatAsync(request);
        // Luôn trả OK để frontend dễ xử lý - error sẽ nằm trong Success=false
        return Ok(result);
    }

    /// <summary>
    /// Gợi ý nguyên liệu thay thế cho một nguyên liệu trong công thức
    /// </summary>
    [HttpPost("swap-suggestions")]
    public async Task<ActionResult<IngredientSwapResponse>> GetSwapSuggestions([FromBody] IngredientSwapRequest request)
    {
        var result = await _aiService.SuggestIngredientSwapsAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách thực đơn của người dùng
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<MealPlanDto>>>> GetMyMealPlans(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        var result = await _mealPlanService.GetUserMealPlansAsync(userId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết thực đơn theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<MealPlanDto>>> GetMealPlan(int id)
    {
        var result = await _mealPlanService.GetMealPlanByIdAsync(id);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Đổi công thức cho một bữa ăn
    /// </summary>
    [HttpPost("{mealPlanId}/meals/{mealId}/regenerate")]
    public async Task<ActionResult<ApiResponse<MealPlanDto>>> RegenerateMeal(int mealPlanId, int mealId)
    {
        var result = await _mealPlanService.RegenerateMealAsync(mealPlanId, mealId);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Xóa thực đơn
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteMealPlan(int id)
    {
        var result = await _mealPlanService.DeleteMealPlanAsync(id);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
}
