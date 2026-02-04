using System.Text;
using System.Text.Json;
using MealPlannerAPI.Data;
using MealPlannerAPI.Models;
using MealPlannerAPI.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MealPlannerAPI.Services.Implementations;

public class AIService : IAIService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<AIService> _logger;
    private readonly MealPlannerDbContext _dbContext;

    // Danh sách các model Gemini để fallback khi bị rate limit
    // Ưu tiên models đã xác nhận hoạt động
    private static readonly string[] FallbackModels = new[]
    {
        "gemini-2.5-flash-lite",  // ✅ Đã test hoạt động
        "gemini-2.5-flash",       // Primary model
        "gemini-2.0-flash",       // Fallback
    };

    public AIService(IConfiguration configuration, HttpClient httpClient, ILogger<AIService> logger, MealPlannerDbContext dbContext)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Lấy danh sách nguyên liệu từ database để AI sử dụng
    /// </summary>
    private async Task<List<Product>> GetAvailableProductsAsync()
    {
        return await _dbContext.Products
            .Where(p => p.IsAvailable && p.QuantityInStock > 0)
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Tạo chuỗi mô tả nguyên liệu cho AI prompt
    /// </summary>
    private string BuildProductListForPrompt(List<Product> products)
    {
        var sb = new StringBuilder();
        sb.AppendLine("\n========================================");
        sb.AppendLine("DANH SÁCH NGUYÊN LIỆU CÓ SẴN TRONG KHO");
        sb.AppendLine("========================================");
        sb.AppendLine();
        sb.AppendLine("⚠️ QUAN TRỌNG: Bạn BẮT BUỘC phải sử dụng CHÍNH XÁC tên nguyên liệu như trong danh sách dưới đây.");
        sb.AppendLine("⚠️ KHÔNG ĐƯỢC thêm thương hiệu, địa danh hay bất kỳ từ nào khác vào tên.");
        sb.AppendLine("⚠️ Ví dụ: Sử dụng 'Cà chua' thay vì 'Cà chua Đà Lạt', sử dụng 'Nước mắm' thay vì 'Nước mắm Phú Quốc'");
        sb.AppendLine();

        var groupedProducts = products.GroupBy(p => p.Category);
        foreach (var group in groupedProducts)
        {
            sb.AppendLine($"## {group.Key}:");
            foreach (var product in group)
            {
                sb.AppendLine($"  ✓ \"{product.Name}\" - {product.Price:N0}đ/{product.Unit} [{product.Calories}kcal, P:{product.Protein}g, C:{product.Carbs}g, F:{product.Fat}g]");
            }
            sb.AppendLine();
        }

        sb.AppendLine("========================================");
        sb.AppendLine("QUY TẮC BẮT BUỘC:");
        sb.AppendLine("========================================");
        sb.AppendLine("1. Tên nguyên liệu trong 'ingredients' PHẢI COPY CHÍNH XÁC từ danh sách trên (bao gồm cả dấu)");
        sb.AppendLine("2. KHÔNG thêm thương hiệu (Vinamilk, TH, Neptune, Phú Quốc, Đà Lạt, CP...)");
        sb.AppendLine("3. KHÔNG thêm từ mô tả (tươi, ngon, nhập khẩu, hữu cơ...)");
        sb.AppendLine("4. Nếu nguyên liệu không có trong danh sách, hãy tìm nguyên liệu thay thế gần nhất");
        sb.AppendLine();

        return sb.ToString();
    }


    public async Task<AIMealPlanResponse?> GenerateMealPlanAsync(AIMealPlanRequest request)
    {
        var geminiApiKey = _configuration["Gemini:ApiKey"];
        
        if (string.IsNullOrEmpty(geminiApiKey))
        {
            _logger.LogWarning("No Gemini API key configured.");
            return null;
        }

        try
        {
            _logger.LogInformation("Using Gemini API");
            return await CallGeminiApiAsync(request, geminiApiKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini API");
            return null;
        }
    }

    private async Task<AIMealPlanResponse?> CallGeminiApiAsync(AIMealPlanRequest request, string apiKey)
    {
        // Lấy danh sách nguyên liệu từ database
        var availableProducts = await GetAvailableProductsAsync();
        var productList = BuildProductListForPrompt(availableProducts);
        
        var prompt = BuildPrompt(request) + productList;
        var systemPrompt = @"Bạn là một chuyên gia dinh dưỡng Việt Nam sáng tạo, đồng thời hiểu rõ về ẩm thực trị liệu (food therapy). 

🎯 NHIỆM VỤ CHÍNH:
Tạo thực đơn ĐỘC ĐÁO, SÁNG TẠO và PHÙ HỢP với yêu cầu của người dùng.
Mỗi lần tạo thực đơn phải KHÁC NHAU, không lặp lại công thức cũ.

⚠️ QUY TẮC BẮT BUỘC VỀ NGUYÊN LIỆU:
1. CHỈ ĐƯỢC sử dụng nguyên liệu từ DANH SÁCH CÓ SẴN được cung cấp bên dưới
2. TUYỆT ĐỐI KHÔNG ĐƯỢC sử dụng nguyên liệu không có trong danh sách (như: nước lọc, tiêu xanh, hành lá... nếu không có trong danh sách)
3. KHÔNG ĐƯỢC thêm bất kỳ từ nào vào tên nguyên liệu (không thêm thương hiệu, địa danh, tính từ)
4. Nếu cần nguyên liệu không có trong danh sách, hãy BỎ QUA hoặc tìm nguyên liệu thay thế gần nhất từ danh sách

📏 QUY TẮC BẮT BUỘC VỀ ĐƠN VỊ:
1. TRỨNG: dùng đơn vị ""quả"" (ví dụ: 2 quả)
2. TRÁI CÂY NHỎ (chanh, ớt, tắc...): dùng đơn vị ""quả"" (ví dụ: 1 quả)
3. THỰC PHẨM KHÔ (thịt, cá, rau củ, gạo, gia vị, BÁNH TRÁNG...): dùng đơn vị ""g"" (gram)
4. CHẤT LỎNG (nước mắm, dầu ăn, sữa, MẬT ONG, giấm...): dùng đơn vị ""ml"" (mililít)
5. KHÔNG ĐƯỢC dùng đơn vị: củ, nhánh, cái, con, muỗng canh, muỗng cà phê
6. Ví dụ:
   - Trứng gà: ""quantity"": 2, ""unit"": ""quả""
   - Chanh: ""quantity"": 1, ""unit"": ""quả"" (1 quả ≈ 50g)
   - Hành tím: ""quantity"": 20, ""unit"": ""g"" (KHÔNG DÙNG ""củ"")
   - Tỏi: ""quantity"": 10, ""unit"": ""g"" (KHÔNG DÙNG ""nhánh"")
   - Bánh tráng: ""quantity"": 60, ""unit"": ""g"" (KHÔNG DÙNG ""cái"")
   - Nước mắm: ""quantity"": 30, ""unit"": ""ml"" (KHÔNG DÙNG ""muỗng canh"")
   - Mật ong: ""quantity"": 15, ""unit"": ""ml"" (KHÔNG DÙNG ""g"")

🧠 HIỂU NGỮ CẢNH NGƯỜI DÙNG:
- 'lạnh', 'rét', 'trời lạnh' → Món ấm nóng: phở, cháo, lẩu, canh gừng
- 'nóng', 'trời nóng', 'nắng' → Món mát: gỏi cuốn, bún trộn, salad
- 'buồn', 'mệt', 'stress', 'chán' → Comfort food ấm áp: xôi, cháo gà, bún riêu
- 'ốm', 'cảm', 'sốt', 'bệnh' → Món dễ tiêu, bổ dưỡng: cháo, súp, canh
- 'tăng cơ', 'gym', 'protein' → Món giàu protein: ức gà, thịt bò, trứng, cá
- 'giảm cân', 'diet' → Món ít calo: salad, rau luộc, cá hấp
- 'tiểu đường' → Món ít đường, ít tinh bột
- 'cao huyết áp' → Món ít muối

📋 FORMAT JSON BẮT BUỘC (không thêm text khác):
{
    ""meals"": [
        {
            ""mealType"": ""Breakfast"" hoặc ""Lunch"" hoặc ""Dinner"",
            ""dishName"": ""Tên món ăn sáng tạo"",
            ""recipe"": ""Công thức nấu chi tiết từng bước"",
            ""description"": ""Mô tả món ăn và lý do phù hợp với yêu cầu người dùng"",
            ""prepTime"": 10,
            ""cookTime"": 20,
            ""servings"": 2,
            ""ingredients"": [
                {
                    ""name"": ""TÊN CHÍNH XÁC TỪ DANH SÁCH"",
                    ""quantity"": 100,
                    ""unit"": ""g hoặc ml hoặc quả"",
                    ""notes"": ""Ghi chú nếu cần""
                }
            ]
        }
    ]
}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = systemPrompt + "\n\n" + prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 8000
            }
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Try each model until one works (fallback on rate limit)
        HttpResponseMessage? response = null;
        string responseContent = "";
        string usedModel = "";
        
        foreach (var model in FallbackModels)
        {
            usedModel = model;
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
            
            // Need new content for each request
            content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            response = await _httpClient.PostAsync(url, content);
            responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Gemini API [{Model}] response status: {Status}", model, response.StatusCode);

            // If rate limited (429) or model not found (404) or server error (500/503), try next model
            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests || 
                response.StatusCode == System.Net.HttpStatusCode.NotFound ||
                response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable ||
                response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
            {
                _logger.LogWarning("Model {Model} failed with status {Status}, trying next model...", model, response.StatusCode);
                continue;
            }
            
            // Success or other error - stop trying
            break;
        }

        _logger.LogInformation("Gemini API response content length: {Length}, used model: {Model}", responseContent.Length, usedModel);

        if (response == null || !response.IsSuccessStatusCode)
        {
            _logger.LogError("Gemini API error (all models failed or error): {Response}", responseContent);
            return null;
        }

        try
        {
            _logger.LogInformation("Parsing Gemini response...");
            var jsonResponse = JsonDocument.Parse(responseContent);
            var textContent = jsonResponse.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            _logger.LogInformation("Extracted text content (first 500 chars): {Content}", textContent?.Substring(0, Math.Min(textContent?.Length ?? 0, 500)));

            if (string.IsNullOrEmpty(textContent))
            {
                _logger.LogWarning("Text content is empty or null");
                return null;
            }

            // Clean up the JSON response (remove markdown code blocks if present)
            textContent = textContent.Trim();
            if (textContent.StartsWith("```json"))
                textContent = textContent.Substring(7);
            else if (textContent.StartsWith("```"))
                textContent = textContent.Substring(3);
            if (textContent.EndsWith("```"))
                textContent = textContent.Substring(0, textContent.Length - 3);
            textContent = textContent.Trim();

            var mealPlanResponse = JsonSerializer.Deserialize<AIMealPlanResponse>(textContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            _logger.LogInformation("Deserialized meal plan with {Count} meals", mealPlanResponse?.Meals?.Count ?? 0);

            return mealPlanResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Gemini response: {Content}", responseContent);
            return null;
        }
    }


    private string BuildPrompt(AIMealPlanRequest request)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine($"Yêu cầu của người dùng: {request.UserRequest}");
        sb.AppendLine();

        if (request.HealthProfile != null)
        {
            sb.AppendLine("Thông tin sức khỏe:");
            if (request.HealthProfile.Weight.HasValue)
                sb.AppendLine($"- Cân nặng: {request.HealthProfile.Weight} kg");
            if (request.HealthProfile.Height.HasValue)
                sb.AppendLine($"- Chiều cao: {request.HealthProfile.Height} cm");
            if (request.HealthProfile.Age.HasValue)
                sb.AppendLine($"- Tuổi: {request.HealthProfile.Age}");
            if (!string.IsNullOrEmpty(request.HealthProfile.Gender))
                sb.AppendLine($"- Giới tính: {request.HealthProfile.Gender}");
            if (!string.IsNullOrEmpty(request.HealthProfile.ActivityLevel))
                sb.AppendLine($"- Mức độ vận động: {request.HealthProfile.ActivityLevel}");
            sb.AppendLine();
        }

        if (request.Allergies?.Any() == true)
        {
            sb.AppendLine($"Dị ứng: {string.Join(", ", request.Allergies)}");
            sb.AppendLine("LƯU Ý: TUYỆT ĐỐI KHÔNG được đề xuất các nguyên liệu gây dị ứng!");
            sb.AppendLine();
        }

        if (request.HealthConditions?.Any() == true)
        {
            sb.AppendLine($"Tình trạng sức khỏe: {string.Join(", ", request.HealthConditions)}");
            sb.AppendLine();
        }

        if (!string.IsNullOrEmpty(request.DietaryPreferences))
        {
            sb.AppendLine($"Chế độ ăn ưa thích: {request.DietaryPreferences}");
            sb.AppendLine();
        }

        if (request.AvailableIngredients.Any())
        {
            sb.AppendLine("Danh sách nguyên liệu có sẵn trong kho (ƯU TIÊN sử dụng các nguyên liệu này):");
            sb.AppendLine(string.Join(", ", request.AvailableIngredients));
            sb.AppendLine();
        }

        sb.AppendLine("Hãy đề xuất thực đơn 3 bữa (Sáng, Trưa, Tối) phù hợp.");

        return sb.ToString();
    }

    // ==================== SALES CHATBOT với FUNCTION CALLING ====================

    /// <summary>
    /// Chatbot bán hàng sáng tạo với Function Calling
    /// </summary>
    public async Task<SalesChatResponse> SalesChatAsync(SalesChatRequest request)
    {
        try
        {
            var geminiApiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(geminiApiKey))
            {
                return new SalesChatResponse
                {
                    Success = false,
                    Message = "Chưa cấu hình API Key cho Gemini. Vui lòng liên hệ admin."
                };
            }

            return await CallGeminiWithFunctionCallingAsync(request, geminiApiKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SalesChatAsync");
            return new SalesChatResponse
            {
                Success = false,
                Message = "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
            };
        }
    }

    /// <summary>
    /// Gọi Gemini API với Function Calling
    /// </summary>
    private async Task<SalesChatResponse> CallGeminiWithFunctionCallingAsync(SalesChatRequest request, string apiKey)
    {
        // Bước 1: Định nghĩa Tool (Function) cho Gemini
        var checkStockFunction = new
        {
            name = "check_stock",
            description = "Kiểm tra tồn kho của một nguyên liệu/sản phẩm trong shop. Trả về thông tin giá, số lượng còn, đơn vị.",
            parameters = new
            {
                type = "object",
                properties = new Dictionary<string, object>
                {
                    ["product_name"] = new
                    {
                        type = "string",
                        description = "Tên nguyên liệu cần kiểm tra (ví dụ: trứng, hành, thịt bò...)"
                    }
                },
                required = new[] { "product_name" }
            }
        };

        var searchByCategoryFunction = new
        {
            name = "search_products_by_category",
            description = "Tìm kiếm sản phẩm theo danh mục (Rau củ, Thịt, Hải sản, Gia vị...)",
            parameters = new
            {
                type = "object",
                properties = new Dictionary<string, object>
                {
                    ["category"] = new
                    {
                        type = "string",
                        description = "Danh mục cần tìm (Rau củ, Thịt, Hải sản, Gia vị, Trứng & Sữa...)"
                    }
                },
                required = new[] { "category" }
            }
        };

        var tools = new[]
        {
            new
            {
                functionDeclarations = new object[] { checkStockFunction, searchByCategoryFunction }
            }
        };

        // System prompt cho Sales Chatbot
        var systemPrompt = @"Bạn là nhân viên tư vấn bán hàng thân thiện của MealPlanner Shop - cửa hàng nguyên liệu nấu ăn.

🎯 NHIỆM VỤ:
1. Khi khách hỏi về nguyên liệu hoặc muốn nấu món gì → GỌI HÀM check_stock để kiểm tra tồn kho
2. Dựa trên kết quả tồn kho → SÁNG TẠO công thức/gợi ý món ăn phù hợp
3. Gợi ý sản phẩm để khách mua

💡 QUY TẮC:
- Luôn check_stock TRƯỚC khi gợi ý (đừng đoán bừa)
- Nếu nguyên liệu hết hàng → gợi ý nguyên liệu thay thế
- Trả lời tự nhiên, thân thiện như nhân viên bán hàng thực sự
- Gợi ý công thức nấu đơn giản, dễ làm
- Nhấn mạnh giá tốt và chất lượng sản phẩm

🚫 XỬ LÝ CÂU HỎI KHÔNG LIÊN QUAN:
- Nếu khách hỏi về chính trị, tôn giáo, bạo lực, nội dung người lớn → Từ chối lịch sự
- Nếu khách hỏi về lĩnh vực khác (công nghệ, giải trí, tin tức...) → Trả lời ngắn gọn: 'Dạ em là trợ lý tư vấn ẩm thực, em chỉ hỗ trợ được về nấu ăn và mua nguyên liệu thôi ạ! Anh/chị có muốn em gợi ý món gì ngon không ạ? 😊'
- Nếu khách chào hỏi, cảm ơn → Đáp lại thân thiện và gợi ý về món ăn

📋 FORMAT TRẢ LỜI:
- Trả lời bằng tiếng Việt tự nhiên
- Nếu gợi ý món: kèm công thức ngắn gọn
- Cuối tin nhắn: liệt kê sản phẩm gợi ý mua (tên + giá)";

        // Bước 2: Tạo request với tools
        var contents = new List<object>
        {
            new
            {
                role = "user",
                parts = new[] { new { text = systemPrompt + "\n\nKhách hàng: " + request.Message } }
            }
        };

        // Thêm conversation history nếu có
        if (request.ConversationHistory != null)
        {
            foreach (var msg in request.ConversationHistory)
            {
                contents.Add(new
                {
                    role = msg.Role == "user" ? "user" : "model",
                    parts = new[] { new { text = msg.Content } }
                });
            }
        }

        var requestBody = new
        {
            contents = contents,
            tools = tools,
            generationConfig = new
            {
                temperature = 0.8,
                maxOutputTokens = 2000
            }
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Bước 3: Gọi Gemini API với fallback models
        HttpResponseMessage? response = null;
        string responseContent = "";
        string usedModel = "";
        
        foreach (var model in FallbackModels)
        {
            usedModel = model;
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
            
            content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            response = await _httpClient.PostAsync(url, content);
            responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("SalesChat [{Model}] response status: {Status}", model, response.StatusCode);

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests || 
                response.StatusCode == System.Net.HttpStatusCode.NotFound ||
                response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable ||
                response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
            {
                _logger.LogWarning("Model {Model} failed with status {Status}, trying next model...", model, response.StatusCode);
                continue;
            }
            break;
        }

        _logger.LogInformation("Gemini initial response (model: {Model}): {Response}", usedModel, responseContent);

        if (response == null || !response.IsSuccessStatusCode)
        {
            _logger.LogError("Gemini API error: {Response}", responseContent);
            return new SalesChatResponse
            {
                Success = false,
                Message = "Xin lỗi, hệ thống đang bận. Vui lòng thử lại."
            };
        }

        // Bước 4: Parse response và xử lý Function Call
        var jsonResponse = JsonDocument.Parse(responseContent);
        var candidate = jsonResponse.RootElement.GetProperty("candidates")[0];
        var contentPart = candidate.GetProperty("content").GetProperty("parts")[0];

        // Kiểm tra xem có function call không
        if (contentPart.TryGetProperty("functionCall", out var functionCall))
        {
            return await HandleFunctionCallAsync(functionCall, request, apiKey, contents);
        }

        // Nếu không có function call, trả về text response
        var textResponse = contentPart.GetProperty("text").GetString() ?? "";
        return new SalesChatResponse
        {
            Success = true,
            Message = textResponse
        };
    }

    /// <summary>
    /// Xử lý Function Call từ Gemini
    /// </summary>
    private async Task<SalesChatResponse> HandleFunctionCallAsync(
        JsonElement functionCall,
        SalesChatRequest originalRequest,
        string apiKey,
        List<object> conversationContents)
    {
        var functionName = functionCall.GetProperty("name").GetString();
        var args = functionCall.GetProperty("args");

        _logger.LogInformation("Gemini requested function: {FunctionName} with args: {Args}", functionName, args.ToString());

        // Thực thi function và lấy kết quả
        var functionResult = await ExecuteFunctionAsync(functionName!, args);

        // Bước 5: Gửi kết quả function về Gemini
        conversationContents.Add(new
        {
            role = "model",
            parts = new[]
            {
                new
                {
                    functionCall = new
                    {
                        name = functionName,
                        args = JsonSerializer.Deserialize<object>(args.GetRawText())
                    }
                }
            }
        });

        conversationContents.Add(new
        {
            role = "function",
            parts = new[]
            {
                new
                {
                    functionResponse = new
                    {
                        name = functionName,
                        response = new { result = functionResult.ResultText }
                    }
                }
            }
        });

        // Tiếp tục gọi Gemini với kết quả function
        var followUpRequest = new
        {
            contents = conversationContents,
            generationConfig = new
            {
                temperature = 0.8,
                maxOutputTokens = 2000
            }
        };

        var jsonContent = JsonSerializer.Serialize(followUpRequest);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";
        var response = await _httpClient.PostAsync(url, content);
        var responseContent = await response.Content.ReadAsStringAsync();

        _logger.LogInformation("Gemini follow-up response: {Response}", responseContent);

        if (!response.IsSuccessStatusCode)
        {
            return new SalesChatResponse
            {
                Success = false,
                Message = "Xin lỗi, có lỗi khi xử lý. Vui lòng thử lại."
            };
        }

        var jsonResponse = JsonDocument.Parse(responseContent);
        var candidate = jsonResponse.RootElement.GetProperty("candidates")[0];
        var contentPart = candidate.GetProperty("content").GetProperty("parts")[0];

        // Kiểm tra nếu Gemini muốn gọi thêm function (recursive)
        if (contentPart.TryGetProperty("functionCall", out var anotherFunctionCall))
        {
            return await HandleFunctionCallAsync(anotherFunctionCall, originalRequest, apiKey, conversationContents);
        }

        var finalResponse = contentPart.GetProperty("text").GetString() ?? "";

        return new SalesChatResponse
        {
            Success = true,
            Message = finalResponse,
            RecommendedProducts = functionResult.Products,
            TotalPrice = functionResult.Products.Sum(p => p.SubTotal),
            OutOfStockItems = functionResult.OutOfStockItems
        };
    }

    /// <summary>
    /// Thực thi function được Gemini yêu cầu
    /// </summary>
    private async Task<FunctionExecutionResult> ExecuteFunctionAsync(string functionName, JsonElement args)
    {
        var result = new FunctionExecutionResult();

        switch (functionName)
        {
            case "check_stock":
                var productName = args.GetProperty("product_name").GetString() ?? "";
                result = await CheckStockAsync(productName);
                break;

            case "search_products_by_category":
                var category = args.GetProperty("category").GetString() ?? "";
                result = await SearchProductsByCategoryAsync(category);
                break;

            default:
                result.ResultText = $"Không tìm thấy hàm {functionName}";
                break;
        }

        return result;
    }

    /// <summary>
    /// Kiểm tra tồn kho sản phẩm - Function được gọi bởi Gemini
    /// </summary>
    private async Task<FunctionExecutionResult> CheckStockAsync(string productName)
    {
        var result = new FunctionExecutionResult();
        var sb = new StringBuilder();

        // Query database
        var products = await _dbContext.Products
            .Where(p => p.Name.ToLower().Contains(productName.ToLower()) ||
                       (p.Keywords != null && p.Keywords.ToLower().Contains(productName.ToLower())))
            .Take(5)
            .ToListAsync();

        if (!products.Any())
        {
            sb.AppendLine($"❌ Không tìm thấy sản phẩm nào với từ khóa '{productName}'");
            result.ResultText = sb.ToString();
            return result;
        }

        sb.AppendLine($"📦 Kết quả tìm kiếm '{productName}':");
        foreach (var p in products)
        {
            var stockStatus = p.QuantityInStock > 0 ? $"Còn {p.QuantityInStock} {p.Unit}" : "HẾT HÀNG";
            var priceDisplay = $"{p.Price:N0}đ/{p.Unit}";

            if (p.QuantityInStock > 0 && p.IsAvailable)
            {
                sb.AppendLine($"  ✅ {p.Name} - {priceDisplay} - {stockStatus}");
                result.Products.Add(new RecommendedProduct
                {
                    ProductId = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    Unit = p.Unit,
                    QuantityInStock = p.QuantityInStock,
                    SuggestedQuantity = 1,
                    SuggestedUnit = p.Unit,
                    SubTotal = p.Price,
                    ImageUrl = p.ImageUrl
                });
            }
            else
            {
                sb.AppendLine($"  ❌ {p.Name} - {priceDisplay} - {stockStatus}");
                result.OutOfStockItems.Add(p.Name);
            }
        }

        result.ResultText = sb.ToString();
        return result;
    }

    /// <summary>
    /// Tìm sản phẩm theo danh mục - Function được gọi bởi Gemini
    /// </summary>
    private async Task<FunctionExecutionResult> SearchProductsByCategoryAsync(string category)
    {
        var result = new FunctionExecutionResult();
        var sb = new StringBuilder();

        var products = await _dbContext.Products
            .Where(p => p.Category != null && p.Category.ToLower().Contains(category.ToLower()) &&
                       p.IsAvailable && p.QuantityInStock > 0)
            .Take(10)
            .ToListAsync();

        if (!products.Any())
        {
            sb.AppendLine($"❌ Không tìm thấy sản phẩm nào trong danh mục '{category}'");
            result.ResultText = sb.ToString();
            return result;
        }

        sb.AppendLine($"📦 Sản phẩm trong danh mục '{category}':");
        foreach (var p in products)
        {
            sb.AppendLine($"  ✅ {p.Name} - {p.Price:N0}đ/{p.Unit} - Còn {p.QuantityInStock} {p.Unit}");
            result.Products.Add(new RecommendedProduct
            {
                ProductId = p.Id,
                Name = p.Name,
                Price = p.Price,
                Unit = p.Unit,
                QuantityInStock = p.QuantityInStock,
                SuggestedQuantity = 1,
                SuggestedUnit = p.Unit,
                SubTotal = p.Price,
                ImageUrl = p.ImageUrl
            });
        }

        result.ResultText = sb.ToString();
        return result;
    }

    /// <summary>
    /// Kết quả thực thi function
    /// </summary>
    private class FunctionExecutionResult
    {
        public string ResultText { get; set; } = string.Empty;
        public List<RecommendedProduct> Products { get; set; } = new();
        public List<string> OutOfStockItems { get; set; } = new();
    }

    /// <summary>
    /// Gợi ý nguyên liệu thay thế cho một nguyên liệu trong công thức
    /// </summary>
    public async Task<IngredientSwapResponse> SuggestIngredientSwapsAsync(IngredientSwapRequest request)
    {
        var geminiApiKey = _configuration["Gemini:ApiKey"];
        
        if (string.IsNullOrEmpty(geminiApiKey))
        {
            return new IngredientSwapResponse
            {
                Success = false,
                Message = "API key không được cấu hình"
            };
        }

        try
        {
            // Lấy danh sách sản phẩm có sẵn trong kho
            var availableProducts = await GetAvailableProductsAsync();
            var productList = BuildProductListForPrompt(availableProducts);

            var prompt = $@"Bạn là chuyên gia ẩm thực Việt Nam sáng tạo. 
            
Món ăn: {request.DishName}
Nguyên liệu cần thay thế: {request.CurrentIngredient} ({request.CurrentQuantity} {request.CurrentUnit})

Nhiệm vụ: Đề xuất 4-6 nguyên liệu CÓ THỂ THAY THẾ cho nguyên liệu trên.

YÊU CẦU QUAN TRỌNG:
1. KHÔNG nhất thiết phải cùng loại - hãy sáng tạo! Ví dụ: tiêu đen có thể thay bằng ớt, gừng, hoặc bỏ luôn.
2. Gợi ý đa dạng: một số cùng chức năng (tạo vị cay/thơm), một số hoàn toàn khác.
3. CHỈ SỬ DỤNG nguyên liệu có trong danh sách kho bên dưới!
4. Có thể gợi ý số lượng = 0 nếu món ăn không cần thành phần này.

{productList}

Trả về JSON:
{{
  ""suggestions"": [
    {{
      ""ingredientName"": ""Tên nguyên liệu từ danh sách kho"",
      ""suggestedQuantity"": 100,
      ""unit"": ""g"",
      ""reason"": ""Lý do ngắn: vì sao thay thế được""
    }}
  ]
}}

Chỉ trả về JSON.";
            
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 2000
                }
            };

            var jsonRequest = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");
            
            // Try each model until one works (fallback on rate limit)
            HttpResponseMessage? response = null;
            string responseContent = "";
            string usedModel = "";
            
            foreach (var model in FallbackModels)
            {
                usedModel = model;
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={geminiApiKey}";
                
                httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");
                response = await _httpClient.PostAsync(url, httpContent);
                responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Swap API [{Model}] response status: {Status}", model, response.StatusCode);

                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests || 
                    response.StatusCode == System.Net.HttpStatusCode.NotFound ||
                    response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable ||
                    response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
                {
                    _logger.LogWarning("Model {Model} failed with status {Status}, trying next model...", model, response.StatusCode);
                    continue;
                }
                break;
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini API error: {StatusCode} - {Content}", response?.StatusCode, responseContent);
                return new IngredientSwapResponse
                {
                    Success = false,
                    Message = $"Gemini API lỗi: {response?.StatusCode}"
                };
            }

            // Parse Gemini response
            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;
            var textContent = root
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(textContent))
            {
                return new IngredientSwapResponse
                {
                    Success = false,
                    Message = "AI không trả về gợi ý"
                };
            }

            // Clean up JSON
            textContent = textContent.Trim();
            if (textContent.StartsWith("```json"))
                textContent = textContent.Substring(7);
            else if (textContent.StartsWith("```"))
                textContent = textContent.Substring(3);
            if (textContent.EndsWith("```"))
                textContent = textContent.Substring(0, textContent.Length - 3);
            textContent = textContent.Trim();

            _logger.LogInformation("Swap suggestions JSON from Gemini: {Json}", textContent);

            // Parse suggestions
            using var suggestionsDoc = JsonDocument.Parse(textContent);
            var suggestionsArray = suggestionsDoc.RootElement.GetProperty("suggestions");
            
            _logger.LogInformation("Found {Count} suggestions", suggestionsArray.GetArrayLength());
            
            var result = new IngredientSwapResponse
            {
                Success = true,
                Message = "Đã tìm thấy các gợi ý thay thế",
                Suggestions = new List<SwapSuggestion>()
            };

            foreach (var suggestion in suggestionsArray.EnumerateArray())
            {
                var ingredientName = suggestion.GetProperty("ingredientName").GetString() ?? "";
                var suggestedQty = suggestion.GetProperty("suggestedQuantity").GetDecimal();
                var unit = suggestion.GetProperty("unit").GetString() ?? "g";
                var reason = suggestion.GetProperty("reason").GetString() ?? "";

                // Tìm sản phẩm trong kho
                var matchedProduct = availableProducts.FirstOrDefault(p => 
                    p.Name.Equals(ingredientName, StringComparison.OrdinalIgnoreCase));

                result.Suggestions.Add(new SwapSuggestion
                {
                    IngredientName = ingredientName,
                    SuggestedQuantity = suggestedQty,
                    Unit = unit,
                    Reason = reason,
                    ProductId = matchedProduct?.Id,
                    Price = matchedProduct?.Price,
                    IsAvailable = matchedProduct != null
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error suggesting ingredient swaps");
            return new IngredientSwapResponse
            {
                Success = false,
                Message = $"Lỗi: {ex.Message}"
            };
        }
    }
}
