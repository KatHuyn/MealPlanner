/**
 * Helper functions để quy đổi đơn vị và tính giá
 * Giúp code dễ hiểu và tránh lặp lại logic
 */

/**
 * Tính giá sản phẩm dựa trên số lượng và đơn vị
 * 
 * LOGIC:
 * - Sản phẩm bán theo kg: có thể chia nhỏ theo gram → tính giá phần trăm
 * - Sản phẩm bán theo lít/chai: KHÔNG thể chia nhỏ → tính nguyên chai
 * - Sản phẩm bán theo chục/vỉ: KHÔNG thể chia nhỏ → tính nguyên vỉ
 * - Sản phẩm bán theo hộp: KHÔNG thể chia nhỏ → tính nguyên hộp
 * 
 * @param productPrice - Giá sản phẩm (VD: 85000 đ/kg)
 * @param productUnit - Đơn vị sản phẩm (VD: "kg", "lít", "chục", "hộp")
 * @param quantity - Số lượng nguyên liệu (VD: 200g, 30ml, 2 quả)
 * @param ingredientUnit - Đơn vị nguyên liệu (VD: "g", "ml", "quả")
 * @returns Giá đã quy đổi
 */
export function calculateIngredientPrice(
    productPrice: number,
    productUnit: string | undefined,
    quantity: number,
    ingredientUnit: string | undefined
): number {
    const prodUnit = (productUnit || 'kg').toLowerCase().trim();
    const ingUnit = (ingredientUnit || '').toLowerCase().trim();

    // ========== CHỈ KG MỚI CÓ THỂ BÁN LẺ THEO GRAM ==========
    // Ví dụ: 200g ức gà với giá 85,000đ/kg = 17,000đ
    if (isGramUnit(ingUnit) && isKilogramUnit(prodUnit)) {
        const adjustedQuantity = quantity / 1000; // 200g = 0.2kg
        return productPrice * adjustedQuantity;
    }

    // Trái cây bán theo kg nhưng AI gợi ý theo "quả"
    // Ví dụ: 1 quả chanh ≈ 50g → giá = 30,000 × 0.05 = 1,500đ
    if (isIndividualUnit(ingUnit) && isKilogramUnit(prodUnit)) {
        const gramsPerFruit = 50; // Ước tính 1 quả trái cây nhỏ ≈ 50g
        const adjustedQuantity = (quantity * gramsPerFruit) / 1000;
        return productPrice * adjustedQuantity;
    }

    // ========== CÁC SẢN PHẨM KHÔNG THỂ BÁN LẺ ==========
    // Tính số lượng đơn vị nguyên cần mua (làm tròn lên)

    // Dầu ăn, nước mắm, etc.: mua nguyên chai/lít
    // Ví dụ: 30ml nước mắm → cần 1 chai (60,000đ)
    if (isMilliliterUnit(ingUnit) && isLiterUnit(prodUnit)) {
        const unitsNeeded = Math.ceil(quantity / 1000); // 30ml → 1 lít, 1200ml → 2 lít
        return productPrice * unitsNeeded;
    }

    // Trứng: mua nguyên vỉ/chục (10 quả)
    // Ví dụ: 2 quả trứng → cần 1 vỉ (35,000đ)
    if (isIndividualUnit(ingUnit) && (isDozenUnit(prodUnit) || isTrayUnit(prodUnit))) {
        const unitsNeeded = Math.ceil(quantity / 10); // 2 quả → 1 chục, 12 quả → 2 chục
        return productPrice * unitsNeeded;
    }

    // Sữa đặc, phô mai hộp: mua nguyên hộp
    // Nếu cùng đơn vị (hộp -> hộp) thì giữ nguyên
    if (isBoxUnit(ingUnit) && isBoxUnit(prodUnit)) {
        return productPrice * Math.ceil(quantity);
    }

    // Trường hợp mặc định: giữ nguyên số lượng
    return productPrice * quantity;
}

/**
 * Lấy đơn vị nhập cho người dùng (g cho kg, ml cho lít)
 */
export function getInputUnit(productUnit: string | undefined): string {
    const unit = (productUnit || '').toLowerCase();
    if (unit === 'kg') return 'g';
    if (unit === 'l' || unit === 'lít') return 'ml';
    return productUnit || '';
}

/**
 * Lấy số lượng tối thiểu dựa trên đơn vị
 */
export function getMinQuantity(productUnit: string | undefined): number {
    const unit = (productUnit || '').toLowerCase();
    if (unit === 'kg') return 100; // Tối thiểu 100g
    if (unit === 'l' || unit === 'lít') return 100; // Tối thiểu 100ml
    return 1;
}

/**
 * Lấy bước nhảy (step) cho input số lượng
 */
export function getQuantityStep(productUnit: string | undefined): number {
    const unit = (productUnit || '').toLowerCase();
    if (unit === 'kg') return 50; // Nhảy 50g
    if (unit === 'l' || unit === 'lít') return 50; // Nhảy 50ml
    return 1;
}

/**
 * Quy đổi số lượng tồn kho sang đơn vị nhập
 * Ví dụ: 5kg = 5000g
 */
export function convertStockToInputUnit(stockQuantity: number, productUnit: string | undefined): number {
    const unit = (productUnit || '').toLowerCase();
    if (unit === 'kg') return stockQuantity * 1000; // 5kg = 5000g
    if (unit === 'l' || unit === 'lít') return stockQuantity * 1000; // 5L = 5000ml
    return stockQuantity;
}

// ============ Helper Functions ============

function isGramUnit(unit: string): boolean {
    return unit === 'g' || unit === 'gram' || unit === 'gam';
}

function isKilogramUnit(unit: string): boolean {
    return unit === 'kg' || unit === 'kilogram';
}

function isMilliliterUnit(unit: string): boolean {
    return unit === 'ml' || unit === 'milliliter';
}

function isLiterUnit(unit: string): boolean {
    return unit === 'l' || unit === 'lít' || unit === 'lit' || unit === 'liter';
}

// Đơn vị đếm từng cái (quả, cái, con...)
function isIndividualUnit(unit: string): boolean {
    return unit === 'quả' || unit === 'qua' || unit === 'cái' || unit === 'con' || unit === 'củ';
}

// Đơn vị chục (10 cái)
function isDozenUnit(unit: string): boolean {
    return unit === 'chục' || unit === 'chuc';
}

// Đơn vị vỉ (thường 10 quả trứng)
function isTrayUnit(unit: string): boolean {
    return unit === 'vỉ' || unit === 'vi';
}

// Đơn vị hộp (sữa đặc, phô mai...)
function isBoxUnit(unit: string): boolean {
    return unit === 'hộp' || unit === 'hop' || unit === 'box';
}

