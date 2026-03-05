namespace MealPlannerAPI.Helpers;

/// <summary>
/// Helper class để quy đổi đơn vị và tính giá
/// Giúp code dễ hiểu và tránh lặp lại logic
/// </summary>
public static class UnitConverter
{
    /// <summary>
    /// Tính giá dựa trên số lượng nguyên liệu và đơn vị
    /// 
    /// LOGIC:
    /// - Sản phẩm bán theo kg: có thể chia nhỏ theo gram → tính giá phần trăm
    /// - Sản phẩm bán theo lít/chai: KHÔNG thể chia nhỏ → tính nguyên chai
    /// - Sản phẩm bán theo chục/vỉ: KHÔNG thể chia nhỏ → tính nguyên vỉ  
    /// - Sản phẩm bán theo hộp: KHÔNG thể chia nhỏ → tính nguyên hộp
    /// </summary>
    public static decimal CalculatePrice(
        decimal productPrice, 
        string? productUnit, 
        decimal ingredientQuantity, 
        string? ingredientUnit)
    {
        var prodUnit = (productUnit ?? "kg").ToLower().Trim();
        var ingUnit = (ingredientUnit ?? "").ToLower().Trim();

        // ========== CHỈ KG MỚI CÓ THỂ BÁN LẺ THEO GRAM ==========
        // Ví dụ: 200g ức gà với giá 85,000đ/kg = 17,000đ
        if (IsGramUnit(ingUnit) && IsKilogramUnit(prodUnit))
        {
            var adjustedQuantity = ingredientQuantity / 1000m;
            return productPrice * adjustedQuantity;
        }

        // Trái cây bán theo kg nhưng AI gợi ý theo "quả"
        // Ví dụ: 1 quả chanh ≈ 50g → giá = 30,000 × 0.05 = 1,500đ
        if (IsIndividualUnit(ingUnit) && IsKilogramUnit(prodUnit))
        {
            const decimal gramsPerFruit = 50m; // Ước tính 1 quả trái cây nhỏ ≈ 50g
            var adjustedQuantity = (ingredientQuantity * gramsPerFruit) / 1000m;
            return productPrice * adjustedQuantity;
        }

        // ========== CÁC SẢN PHẨM KHÔNG THỂ BÁN LẺ ==========
        // Tính số lượng đơn vị nguyên cần mua (làm tròn lên)
        
        // Dầu ăn, nước mắm: mua nguyên chai/lít
        if (IsMilliliterUnit(ingUnit) && IsLiterUnit(prodUnit))
        {
            var unitsNeeded = Math.Ceiling(ingredientQuantity / 1000m);
            return productPrice * unitsNeeded;
        }

        // Trứng: mua nguyên vỉ/chục (10 quả)
        if (IsIndividualUnit(ingUnit) && (IsDozenUnit(prodUnit) || IsTrayUnit(prodUnit)))
        {
            var unitsNeeded = Math.Ceiling(ingredientQuantity / 10m);
            return productPrice * unitsNeeded;
        }

        // Sữa đặc, phô mai hộp: mua nguyên hộp
        if (IsBoxUnit(ingUnit) && IsBoxUnit(prodUnit))
        {
            return productPrice * Math.Ceiling(ingredientQuantity);
        }

        // Trường hợp mặc định
        return productPrice * ingredientQuantity;
    }

    /// <summary>
    /// Chuyển đổi số lượng từ đơn vị đặt hàng sang đơn vị kho (product stock unit).
    /// Ví dụ: 200g → 0.2kg, 500ml → 0.5L
    /// Dùng để so sánh và trừ tồn kho chính xác.
    /// </summary>
    public static decimal ConvertToStockUnit(decimal quantity, string? orderUnit, string? stockUnit)
    {
        var ordUnit = (orderUnit ?? "").ToLower().Trim();
        var stUnit = (stockUnit ?? "kg").ToLower().Trim();

        // gram → kg
        if (IsGramUnit(ordUnit) && IsKilogramUnit(stUnit))
            return quantity / 1000m;

        // ml → lít
        if (IsMilliliterUnit(ordUnit) && IsLiterUnit(stUnit))
            return quantity / 1000m;

        // Cùng đơn vị hoặc không cần chuyển đổi
        return quantity;
    }

    /// <summary>
    /// Kiểm tra đơn vị có phải gram không
    /// </summary>
    public static bool IsGramUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "g" || u == "gram" || u == "gam";
    }

    /// <summary>
    /// Kiểm tra đơn vị có phải kilogram không
    /// </summary>
    public static bool IsKilogramUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "kg" || u == "kilogram" || u == "kí" || u == "ký";
    }

    /// <summary>
    /// Kiểm tra đơn vị có phải mililit không
    /// </summary>
    public static bool IsMilliliterUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "ml" || u == "milliliter";
    }

    /// <summary>
    /// Kiểm tra đơn vị có phải lít không
    /// </summary>
    public static bool IsLiterUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "l" || u == "lít" || u == "lit" || u == "liter";
    }

    /// <summary>
    /// Kiểm tra đơn vị đếm từng cái (quả, cái, con...)
    /// </summary>
    public static bool IsIndividualUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "quả" || u == "qua" || u == "cái" || u == "con" || u == "củ";
    }

    /// <summary>
    /// Kiểm tra đơn vị chục (10 cái)
    /// </summary>
    public static bool IsDozenUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "chục" || u == "chuc";
    }

    /// <summary>
    /// Kiểm tra đơn vị vỉ (thường 10 quả trứng)
    /// </summary>
    public static bool IsTrayUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "vỉ" || u == "vi";
    }

    /// <summary>
    /// Kiểm tra đơn vị hộp (sữa đặc, phô mai...)
    /// </summary>
    public static bool IsBoxUnit(string unit)
    {
        var u = unit.ToLower().Trim();
        return u == "hộp" || u == "hop" || u == "box";
    }
}
