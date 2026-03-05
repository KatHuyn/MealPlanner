using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MealPlannerAPI.Models.DTOs;
using MealPlannerAPI.Services;

namespace MealPlannerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>
    /// Lấy danh sách tất cả sản phẩm
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetProducts(
        [FromQuery] string? category = null,
        [FromQuery] bool? availableOnly = true)
    {
        var result = await _productService.GetAllProductsAsync(category, availableOnly);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách danh mục
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetCategories()
    {
        var result = await _productService.GetCategoriesAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết sản phẩm theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetProduct(int id)
    {
        var result = await _productService.GetProductByIdAsync(id);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Tạo sản phẩm mới (Admin only)
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _productService.CreateProductAsync(request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return CreatedAtAction(nameof(GetProduct), new { id = result.Data?.Id }, result);
    }

    /// <summary>
    /// Cập nhật sản phẩm (Admin only)
    /// </summary>
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(int id, [FromBody] CreateProductRequest request)
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _productService.UpdateProductAsync(id, request);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Xóa sản phẩm (Admin only)
    /// </summary>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteProduct(int id)
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _productService.DeleteProductAsync(id);
        
        if (!result.Success)
            return NotFound(result);
            
        return Ok(result);
    }

    /// <summary>
    /// Toggle ẩn/hiện sản phẩm (Admin only)
    /// </summary>
    [Authorize]
    [HttpPatch("{id}/toggle-visibility")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> ToggleProductVisibility(int id)
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _productService.ToggleProductVisibilityAsync(id);
        
        if (!result.Success)
            return BadRequest(result);
            
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Lấy tất cả sản phẩm kể cả ẩn (debug)
    /// </summary>
    [Authorize]
    [HttpGet("admin/all")]
    public async Task<ActionResult<ApiResponse<List<ProductDto>>>> GetAllProductsAdmin()
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _productService.GetAllProductsAdminAsync();
        return Ok(result);
    }

    /// <summary>
    /// [Admin] Unhide tất cả sản phẩm (quick fix)
    /// </summary>
    [Authorize]
    [HttpPost("admin/unhide-all")]
    public async Task<ActionResult<ApiResponse<bool>>> UnhideAllProducts()
    {
        if (!IsAdmin())
            return Forbid();

        var result = await _productService.UnhideAllProductsAsync();
        return Ok(result);
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirst("IsAdmin");
        return isAdminClaim?.Value?.ToLower() == "true";
    }
}
