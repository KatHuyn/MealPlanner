using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MealPlannerAPI.Models.DTOs;
using MealPlannerAPI.Services;

namespace MealPlannerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Tạo đơn hàng mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        var result = await _orderService.CreateOrderAsync(userId, request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return CreatedAtAction(nameof(GetOrder), new { id = result.Data?.Id }, result);
    }

    /// <summary>
    /// Tạo đơn hàng từ thực đơn (mua tất cả nguyên liệu)
    /// </summary>
    [HttpPost("from-meal-plan/{mealPlanId}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrderFromMealPlan(
        int mealPlanId,
        [FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        var result = await _orderService.CreateOrderFromMealPlanAsync(userId, mealPlanId, request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return CreatedAtAction(nameof(GetOrder), new { id = result.Data?.Id }, result);
    }

    /// <summary>
    /// Lấy danh sách đơn hàng của tôi
    /// </summary>
    [HttpGet("my-orders")]
    public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetMyOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        var result = await _orderService.GetUserOrdersAsync(userId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết đơn hàng theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrder(int id)
    {
        var result = await _orderService.GetOrderByIdAsync(id);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Hủy đơn hàng
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ApiResponse<bool>>> CancelOrder(int id, [FromBody] CancelOrderRequest request)
    {
        var result = await _orderService.CancelOrderAsync(id, request.Reason);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Lấy thống kê dashboard
    /// </summary>
    [HttpGet("admin/dashboard-stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetDashboardStats()
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _orderService.GetDashboardStatsAsync();
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Lấy tất cả đơn hàng
    /// </summary>
    [HttpGet("admin/all")]
    public async Task<ActionResult<ApiResponse<List<OrderDto>>>> GetAllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _orderService.GetAllOrdersAsync(page, pageSize, status, startDate, endDate);
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Cập nhật trạng thái đơn hàng
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request)
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _orderService.UpdateOrderStatusAsync(id, request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirst("IsAdmin");
        return isAdminClaim?.Value?.ToLower() == "true";
    }
}

public class CancelOrderRequest
{
    public string Reason { get; set; } = string.Empty;
}
