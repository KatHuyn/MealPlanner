using Microsoft.EntityFrameworkCore;
using MealPlannerAPI.Data;
using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;

namespace MealPlannerAPI.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly MealPlannerDbContext _context;
    private readonly ILogger<OrderService> _logger;

    public OrderService(MealPlannerDbContext context, ILogger<OrderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApiResponse<OrderDto>> CreateOrderAsync(int userId, CreateOrderRequest request)
    {
        try
        {
            if (!request.Items.Any())
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = "Đơn hàng phải có ít nhất một sản phẩm"
                };
            }

            var order = new Order
            {
                UserId = userId,
                MealPlanId = request.MealPlanId,
                OrderCode = GenerateOrderCode(),
                Status = OrderStatus.Pending,
                ShippingAddress = request.ShippingAddress,
                ReceiverPhone = request.ReceiverPhone,
                ReceiverName = request.ReceiverName,
                Notes = request.Notes,
                PaymentMethod = request.PaymentMethod ?? "COD",
                CreatedAt = DateTime.UtcNow
            };

            decimal totalAmount = 0;

            foreach (var item in request.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                {
                    return new ApiResponse<OrderDto>
                    {
                        Success = false,
                        Message = $"Không tìm thấy sản phẩm với ID {item.ProductId}"
                    };
                }

                // Chuyển đổi số lượng đặt hàng (grams) sang đơn vị tồn kho (kg) trước khi so sánh
                var quantityInStockUnit = Helpers.UnitConverter.ConvertToStockUnit(
                    item.Quantity, "g", product.Unit);

                if (!product.IsAvailable || product.QuantityInStock < quantityInStockUnit)
                {
                    return new ApiResponse<OrderDto>
                    {
                        Success = false,
                        Message = $"Sản phẩm {product.Name} không đủ số lượng trong kho"
                    };
                }

                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    TotalPrice = Helpers.UnitConverter.CalculatePrice(
                        product.Price,
                        product.Unit,
                        item.Quantity,
                        "g" // Cart items luôn gửi số lượng theo gram
                    )
                };

                order.OrderItems.Add(orderItem);
                totalAmount += orderItem.TotalPrice;
            }

            order.TotalAmount = totalAmount;
            order.ShippingFee = CalculateShippingFee(totalAmount);
            order.FinalAmount = totalAmount + (order.ShippingFee ?? 0) - (order.DiscountAmount ?? 0);

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // TODO: Send push notification to admin

            return await GetOrderByIdAsync(order.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order for user {UserId}", userId);
            return new ApiResponse<OrderDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi tạo đơn hàng",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<OrderDto>> CreateOrderFromMealPlanAsync(int userId, int mealPlanId, CreateOrderRequest request)
    {
        try
        {
            var mealPlan = await _context.MealPlans
                .Include(mp => mp.Meals)
                    .ThenInclude(m => m.Ingredients)
                        .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(mp => mp.Id == mealPlanId && mp.UserId == userId);

            if (mealPlan == null)
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = "Không tìm thấy thực đơn"
                };
            }

            // Build order directly from meal plan ingredients
            var order = new Order
            {
                UserId = userId,
                MealPlanId = mealPlanId,
                OrderCode = GenerateOrderCode(),
                Status = OrderStatus.Pending,
                ShippingAddress = request.ShippingAddress,
                ReceiverPhone = request.ReceiverPhone,
                ReceiverName = request.ReceiverName,
                Notes = request.Notes ?? $"Đơn hàng từ thực đơn #{mealPlanId}",
                PaymentMethod = request.PaymentMethod ?? "COD",
                CreatedAt = DateTime.UtcNow
            };

            decimal totalAmount = 0;

            // Aggregate ingredients by productId (in case same product appears multiple times)
            var productPrices = new Dictionary<int, (Product Product, decimal Price)>();

            foreach (var meal in mealPlan.Meals)
            {
                foreach (var ingredient in meal.Ingredients)
                {
                    if (ingredient.IsMatched && ingredient.ProductId.HasValue && ingredient.Product != null)
                    {
                        // Tính giá sử dụng UnitConverter
                        var itemPrice = Helpers.UnitConverter.CalculatePrice(
                            ingredient.Product.Price,
                            ingredient.Product.Unit,
                            ingredient.Quantity,
                            ingredient.Unit
                        );

                        if (productPrices.ContainsKey(ingredient.ProductId.Value))
                        {
                            var existing = productPrices[ingredient.ProductId.Value];
                            productPrices[ingredient.ProductId.Value] = (existing.Product, existing.Price + itemPrice);
                        }
                        else
                        {
                            productPrices[ingredient.ProductId.Value] = (ingredient.Product, itemPrice);
                        }
                    }
                }
            }

            if (!productPrices.Any())
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = "Không có sản phẩm nào trong thực đơn có sẵn trong kho"
                };
            }

            // Create order items
            foreach (var (productId, (product, price)) in productPrices)
            {
                var orderItem = new OrderItem
                {
                    ProductId = productId,
                    Quantity = 1, // Mỗi item đại diện cho lượng cần cho thực đơn
                    UnitPrice = price, // Giá đã tính chuyển đổi đơn vị
                    TotalPrice = price
                };

                order.OrderItems.Add(orderItem);
                totalAmount += price;
            }

            order.TotalAmount = totalAmount;
            order.ShippingFee = CalculateShippingFee(totalAmount);
            order.FinalAmount = totalAmount + (order.ShippingFee ?? 0) - (order.DiscountAmount ?? 0);

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return await GetOrderByIdAsync(order.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order from meal plan {MealPlanId}", mealPlanId);
            return new ApiResponse<OrderDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<OrderDto>> GetOrderByIdAsync(int orderId)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = "Không tìm thấy đơn hàng"
                };
            }

            return new ApiResponse<OrderDto>
            {
                Success = true,
                Data = MapToOrderDto(order)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<OrderDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<List<OrderDto>>> GetUserOrdersAsync(int userId, int page = 1, int pageSize = 10)
    {
        try
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .ToListAsync();

            return new ApiResponse<List<OrderDto>>
            {
                Success = true,
                Data = orders.Select(MapToOrderDto).ToList()
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<OrderDto>>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<List<OrderDto>>> GetAllOrdersAsync(int page = 1, int pageSize = 20, string? status = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            var query = _context.Orders.AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }

            // Filter by start date
            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= startDate.Value);
            }

            // Filter by end date
            if (endDate.HasValue)
            {
                var endDateWithTime = endDate.Value.AddDays(1).AddTicks(-1); // End of day
                query = query.Where(o => o.CreatedAt <= endDateWithTime);
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.User)
                .ToListAsync();

            return new ApiResponse<List<OrderDto>>
            {
                Success = true,
                Data = orders.Select(MapToOrderDto).ToList()
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<OrderDto>>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<OrderDto>> UpdateOrderStatusAsync(int orderId, UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = "Không tìm thấy đơn hàng"
                };
            }

            if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            {
                return new ApiResponse<OrderDto>
                {
                    Success = false,
                    Message = "Trạng thái không hợp lệ"
                };
            }

            order.Status = newStatus;

            switch (newStatus)
            {
                case OrderStatus.Confirmed:
                    order.ConfirmedAt = DateTime.UtcNow;
                    // Reduce stock
                    foreach (var item in order.OrderItems)
                    {
                        var product = await _context.Products.FindAsync(item.ProductId);
                        if (product != null)
                        {
                            product.QuantityInStock -= item.Quantity;
                        }
                    }
                    break;
                case OrderStatus.Shipping:
                    order.ShippedAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Delivered:
                    order.DeliveredAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Cancelled:
                    order.CancelledAt = DateTime.UtcNow;
                    order.CancellationReason = request.Reason;
                    // Restore stock if already confirmed
                    if (order.ConfirmedAt.HasValue)
                    {
                        foreach (var item in order.OrderItems)
                        {
                            var product = await _context.Products.FindAsync(item.ProductId);
                            if (product != null)
                            {
                                product.QuantityInStock += item.Quantity;
                            }
                        }
                    }
                    break;
            }

            await _context.SaveChangesAsync();

            return new ApiResponse<OrderDto>
            {
                Success = true,
                Message = "Cập nhật trạng thái đơn hàng thành công",
                Data = MapToOrderDto(order)
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<OrderDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    public async Task<ApiResponse<bool>> CancelOrderAsync(int orderId, string reason)
    {
        var result = await UpdateOrderStatusAsync(orderId, new UpdateOrderStatusRequest
        {
            Status = OrderStatus.Cancelled.ToString(),
            Reason = reason
        });

        return new ApiResponse<bool>
        {
            Success = result.Success,
            Message = result.Message,
            Data = result.Success,
            Errors = result.Errors
        };
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync()
    {
        try
        {
            // Convert UTC to Vietnam timezone (UTC+7)
            var vietnamTz = TimeZoneInfo.CreateCustomTimeZone("Vietnam Standard Time", TimeSpan.FromHours(7), "Vietnam Standard Time", "Vietnam Standard Time");
            var vietnamNow = TimeZoneInfo.ConvertTime(DateTime.UtcNow, vietnamTz);
            var today = vietnamNow.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);

            _logger.LogInformation($"Dashboard Stats - UTC Now: {DateTime.UtcNow}, Vietnam Now: {vietnamNow}, Today: {today}");

            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .ToListAsync();

            var deliveredOrders = orders.Where(o => o.Status == OrderStatus.Delivered).ToList();

            // Count today's orders: COD uses DeliveredAt, others use CreatedAt
            var todayOrders = orders.Count(o =>
            {
                if (o.PaymentMethod == "COD")
                {
                    // COD: count by delivery date
                    return o.DeliveredAt.HasValue && TimeZoneInfo.ConvertTime(o.DeliveredAt.Value, vietnamTz).Date == today;
                }
                else
                {
                    // Prepaid (BankTransfer, etc): count by order creation date
                    return TimeZoneInfo.ConvertTime(o.CreatedAt, vietnamTz).Date == today;
                }
            });

            // Count month's orders: COD uses DeliveredAt, others use CreatedAt
            var monthOrders = orders.Count(o =>
            {
                if (o.PaymentMethod == "COD")
                {
                    // COD: count by delivery date
                    return o.DeliveredAt.HasValue && TimeZoneInfo.ConvertTime(o.DeliveredAt.Value, vietnamTz).Date >= monthStart;
                }
                else
                {
                    // Prepaid: count by order creation date
                    return TimeZoneInfo.ConvertTime(o.CreatedAt, vietnamTz).Date >= monthStart;
                }
            });

            var stats = new DashboardStatsDto
            {
                TotalOrders = orders.Count,
                PendingOrders = orders.Count(o => o.Status == OrderStatus.Pending),
                ConfirmedOrders = orders.Count(o => o.Status == OrderStatus.Confirmed),
                ProcessingOrders = orders.Count(o => o.Status == OrderStatus.Processing),
                ShippingOrders = orders.Count(o => o.Status == OrderStatus.Shipping),
                DeliveredOrders = orders.Count(o => o.Status == OrderStatus.Delivered),
                CancelledOrders = orders.Count(o => o.Status == OrderStatus.Cancelled),

                TotalRevenue = deliveredOrders.Sum(o => o.FinalAmount),
                TodayRevenue = deliveredOrders
                    .Where(o => o.DeliveredAt.HasValue && TimeZoneInfo.ConvertTime(o.DeliveredAt.Value, vietnamTz).Date == today)
                    .Sum(o => o.FinalAmount),
                MonthRevenue = deliveredOrders
                    .Where(o => o.DeliveredAt.HasValue && TimeZoneInfo.ConvertTime(o.DeliveredAt.Value, vietnamTz).Date >= monthStart)
                    .Sum(o => o.FinalAmount),

                TodayOrders = todayOrders,
                MonthOrders = monthOrders,

                TopProducts = deliveredOrders
                    .SelectMany(o => o.OrderItems)
                    .GroupBy(oi => new { oi.ProductId, ProductName = oi.Product?.Name ?? "Unknown" })
                    .Select(g => new TopProductDto
                    {
                        ProductId = g.Key.ProductId,
                        ProductName = g.Key.ProductName,
                        TotalQuantitySold = g.Count(),  // Number of times sold (count of orders), not total units
                        TotalRevenue = g.Sum(oi => oi.TotalPrice)
                    })
                    .OrderByDescending(p => p.TotalQuantitySold)
                    .Take(5)
                    .ToList()
            };

            return new ApiResponse<DashboardStatsDto>
            {
                Success = true,
                Data = stats
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats");
            return new ApiResponse<DashboardStatsDto>
            {
                Success = false,
                Message = "Có lỗi xảy ra khi lấy thống kê",
                Errors = new List<string> { ex.Message }
            };
        }
    }

    private static string GenerateOrderCode()
    {
        return $"ORD{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private static decimal CalculateShippingFee(decimal totalAmount)
    {
        // Free shipping for orders over 500,000 VND
        if (totalAmount >= 500000)
            return 0;
        
        // Standard shipping fee
        return 30000;
    }

    private static OrderDto MapToOrderDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            ShippingFee = order.ShippingFee,
            FinalAmount = order.FinalAmount,
            ShippingAddress = order.ShippingAddress,
            ReceiverPhone = order.ReceiverPhone,
            ReceiverName = order.ReceiverName,
            Notes = order.Notes,
            PaymentMethod = order.PaymentMethod,
            CreatedAt = order.CreatedAt,
            Items = order.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                ProductName = oi.Product?.Name ?? "Unknown",
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                TotalPrice = oi.TotalPrice
            }).ToList()
        };
    }
}
