import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/models';
import {
  calculateIngredientPrice,
  getInputUnit as utilGetInputUnit,
  getMinQuantity as utilGetMinQuantity,
  getQuantityStep,
  convertStockToInputUnit
} from '../../utils/unit-converter';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="products-container">
      @if (swapMode) {
        <div class="swap-banner">
          <div class="swap-info">
            <span class="swap-icon">🔄</span>
            <div>Đang chọn nguyên liệu thay thế cho: <strong>{{ swapIngredientName }}</strong></div>
          </div>
          <button class="btn-cancel" (click)="cancelSwap()">Hủy</button>
        </div>
      }
      @if (addMode) {
        <div class="swap-banner" style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)">
          <div class="swap-info">
            <span class="swap-icon">➕</span>
            <div>Đang thêm nguyên liệu vào: <strong>{{ addMealName }}</strong></div>
          </div>
          <button class="btn-cancel" (click)="cancelAdd()">Hủy</button>
        </div>
      }
      
      <div class="products-header">
        <h1>🛒 {{ swapMode ? 'Chọn nguyên liệu thay thế' : addMode ? 'Chọn nguyên liệu để thêm' : 'Danh sách sản phẩm' }}</h1>
        <p>{{ swapMode ? 'Chọn nguyên liệu bạn muốn thay thế' : addMode ? 'Chọn nguyên liệu bạn muốn thêm vào công thức' : 'Chọn nguyên liệu bạn cần cho bữa ăn' }}</p>
      </div>

      <div class="products-filters">
        <div class="search-box">
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="search()" placeholder="🔍 Tìm kiếm sản phẩm...">
        </div>
        <div class="category-filters">
          <button [class.active]="selectedCategory === ''" (click)="filterByCategory('')">Tất cả</button>
          @for (cat of categories; track cat) {
            <button [class.active]="selectedCategory === cat" (click)="filterByCategory(cat)">{{ cat }}</button>
          }
        </div>
      </div>

      <div class="products-grid">
        @for (product of filteredProducts; track product.id) {
          <div class="product-card">
            <div class="product-image">
              <img [src]="product.imageUrl || 'https://placehold.co/300x200/f5f5f5/999?text='+product.name" [alt]="product.name">
              <span class="category-badge">{{ product.category }}</span>
            </div>
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              @if (product.description) {
                <p class="product-description">{{ product.description }}</p>
              }
              
              @if (product.calories) {
                <div class="nutrition-info">
                  <span>🔥 {{ product.calories }} cal</span>
                  @if (product.protein) {
                    <span>💪 {{ product.protein }}g protein</span>
                  }
                </div>
              }

              <div class="product-footer">
                <div class="price">
                  <span class="amount">{{ product.price | number }}</span>
                  <span class="unit">đ/{{ product.unit }}</span>
                </div>
                <div class="stock" [class.low]="product.quantityInStock < 10" [class.out]="product.quantityInStock <= 0">
                  @if (product.quantityInStock > 0) {
                    📦 Còn {{ product.quantityInStock | number:'1.0-0' }} {{ product.unit }}
                  } @else {
                    ❌ Hết hàng
                  }
                </div>
              </div>

              <div class="quantity-selector">
                <label>Số lượng ({{ getInputUnit(product) }}): <span class="min-hint">Tối thiểu {{ getMinQuantity(product) }}{{ getInputUnit(product) }}</span></label>
                <div class="quantity-input-group">
                  <button type="button" class="qty-btn" (click)="decreaseQuantity(product)" [disabled]="getQuantity(product) <= getMinQuantity(product)">−</button>
                  <input 
                    type="number" 
                    [ngModel]="getQuantity(product)"
                    (ngModelChange)="setQuantity(product, $event)"
                    [min]="getMinQuantity(product)"
                    [max]="getMaxQuantity(product)"
                    [step]="getStep(product)"
                    #qtyInput>
                  <button type="button" class="qty-btn" (click)="increaseQuantity(product)" [disabled]="getQuantity(product) >= getMaxQuantity(product)">+</button>
                </div>
                @if (isQuantityBelowMin(product, qtyInput.value)) {
                  <div class="quantity-warning">
                    ⚠️ Số lượng tối thiểu là {{ getMinQuantity(product) }}{{ getInputUnit(product) }}
                  </div>
                }
                <div class="quantity-price">
                  ≈ {{ calculatePrice(product) | number:'1.0-0' }} đ
                </div>
              </div>

              @if (swapMode) {
                <button class="btn-select-swap" [disabled]="!product.isAvailable || product.quantityInStock <= 0" (click)="selectForSwap(product)">
                  {{ product.isAvailable && product.quantityInStock > 0 ? '✅ Chọn nguyên liệu này' : 'Hết hàng' }}
                </button>
              } @else if (addMode) {
                <button class="btn-select-swap" [disabled]="!product.isAvailable || product.quantityInStock <= 0" (click)="selectForAdd(product)">
                  {{ product.isAvailable && product.quantityInStock > 0 ? '➕ Thêm nguyên liệu này' : 'Hết hàng' }}
                </button>
              } @else {
                <button class="btn-add-cart" [disabled]="!product.isAvailable || product.quantityInStock <= 0" (click)="addToCart(product)">
                  {{ product.isAvailable && product.quantityInStock > 0 ? '🛒 Thêm vào giỏ' : 'Hết hàng' }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (filteredProducts.length === 0) {
        <div class="empty-state">
          <p>😢 Không tìm thấy sản phẩm phù hợp</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .products-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .products-header { text-align: center; margin-bottom: 2rem; }
    .products-header h1 { color: #333; margin-bottom: 0.5rem; }
    .products-header p { color: #666; }
    .products-filters { margin-bottom: 2rem; }
    .search-box { margin-bottom: 1rem; }

    .search-box input {
      width: 100%;
      max-width: 500px;
      padding: 1rem 1.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 30px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .search-box input:focus { outline: none; border-color: #667eea; }
    .category-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    .category-filters button {
      padding: 0.5rem 1.25rem;
      border: 2px solid #e0e0e0;
      border-radius: 20px;
      background: white;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-filters button:hover { border-color: #667eea; color: #667eea; }

    .category-filters button.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: transparent;
      color: white;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border-radius: 16px;
      overflow: visible;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: transform 0.3s, box-shadow 0.3s;
      display: flex;
      flex-direction: column;
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }

    .product-image {
      position: relative;
      height: 180px;
      background: #f5f5f5;
      overflow: hidden;
      border-radius: 16px 16px 0 0;
    }

    .product-image img { width: 100%; height: 100%; object-fit: cover; }

    .category-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(102, 126, 234, 0.9);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .product-info { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
    .product-info h3 { margin: 0 0 0.5rem; color: #333; font-size: 1.1rem; }

    .product-description {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .nutrition-info {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #888;
      margin-bottom: 0.75rem;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .price .amount { font-size: 1.25rem; font-weight: bold; color: #27ae60; }
    .price .unit { color: #888; font-size: 0.875rem; }
    .stock { font-size: 0.8rem; color: #888; padding: 0.25rem 0.5rem; background: #e8f5e9; border-radius: 4px; }
    .stock.low { color: #e74c3c; background: #fff3e0; }
    .stock.out { color: #fff; background: #e74c3c; }

    .quantity-selector {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .quantity-selector label {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .quantity-input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      border: 2px solid #667eea;
      border-radius: 6px;
      background: white;
      color: #667eea;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qty-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }

    .qty-btn:disabled {
      border-color: #ccc;
      color: #ccc;
      cursor: not-allowed;
    }

    .quantity-input-group input {
      width: 80px;
      padding: 0.5rem;
      text-align: center;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
    }

    .quantity-input-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .quantity-price {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: #27ae60;
      font-weight: 600;
    }

    .quantity-warning {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      color: #856404;
      font-size: 0.8rem;
    }

    .min-hint {
      font-size: 0.75rem;
      color: #888;
      font-weight: normal;
    }

    .btn-add-cart {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-add-cart:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-add-cart:disabled { background: #ccc; cursor: not-allowed; }
    .empty-state { text-align: center; padding: 3rem; color: #666; font-size: 1.25rem; }

    /* Swap Mode Styles */
    .swap-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .swap-info { display: flex; align-items: center; gap: 1rem; }
    .swap-icon { font-size: 1.5rem; }
    .btn-cancel {
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-cancel:hover { background: rgba(255,255,255,0.3); }
    .btn-select-swap {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-select-swap:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
    }
    .btn-select-swap:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchQuery = '';

  // Map để lưu số lượng đã chọn cho từng sản phẩm
  selectedQuantities = new Map<number, number>();

  // Swap mode state
  swapMode = false;
  swapMealPlanId = 0;
  swapMealId = 0;
  swapIngredientId = 0;
  swapIngredientName = '';
  swapQuantity = 0;
  swapUnit = '';

  // Add mode state
  addMode = false;
  addMealPlanId = 0;
  addMealId = 0;
  addMealName = '';

  ngOnInit(): void {
    // Check for swap mode params
    this.route.queryParams.subscribe(params => {
      this.swapMode = params['swapMode'] === 'true';
      if (this.swapMode) {
        this.swapMealPlanId = +params['mealPlanId'] || 0;
        this.swapMealId = +params['mealId'] || 0;
        this.swapIngredientId = +params['ingredientId'] || 0;
        this.swapIngredientName = params['ingredientName'] || '';
        this.swapQuantity = +params['quantity'] || 0;
        this.swapUnit = params['unit'] || 'g';
      }
      this.addMode = params['addMode'] === 'true';
      if (this.addMode) {
        this.addMealPlanId = +params['mealPlanId'] || 0;
        this.addMealId = +params['mealId'] || 0;
        this.addMealName = params['mealName'] || '';
      }
    });
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.cdr.markForCheck();
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.markForCheck();
      }
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  search(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {
      const matchCategory = !this.selectedCategory || p.category === this.selectedCategory;
      const matchSearch = !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (p.keywords && p.keywords.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }

  addToCart(product: Product): void {
    const quantity = this.getQuantity(product);
    const unit = this.getInputUnit(product);
    this.cartService.addToCart(product, quantity);
    // Hiển thị thông báo
    alert(`✅ Đã thêm ${product.name} (${quantity}${unit}) vào giỏ hàng!`);
    // Reset số lượng về mặc định sau khi thêm vào giỏ
    this.selectedQuantities.delete(product.id);
  }

  // Chọn nguyên liệu để thay thế
  selectForSwap(product: Product): void {
    const quantity = this.getQuantity(product);
    const inputUnit = this.getInputUnit(product); // g, ml thay vì kg, lit
    // Navigate về trang meal-plan-detail với thông tin swap
    this.router.navigate(['/meal-plans', this.swapMealPlanId], {
      queryParams: {
        swapComplete: true,
        mealId: this.swapMealId,
        ingredientId: this.swapIngredientId,
        newProductId: product.id,
        newProductName: product.name,
        newQuantity: quantity,
        newUnit: inputUnit,
        productUnit: product.unit, // Unit gốc (kg/lit) cho tính giá
        newPrice: product.price
      }
    });
  }

  // Hủy swap và quay về trang meal-plan-detail
  cancelSwap(): void {
    this.router.navigate(['/meal-plans', this.swapMealPlanId]);
  }

  // Chọn nguyên liệu để thêm vào công thức
  selectForAdd(product: Product): void {
    const quantity = this.getQuantity(product);
    const inputUnit = this.getInputUnit(product);
    this.router.navigate(['/meal-plans', this.addMealPlanId], {
      queryParams: {
        addComplete: true,
        mealId: this.addMealId,
        productId: product.id,
        quantity: quantity,
        unit: inputUnit
      }
    });
  }

  // Hủy add và quay về trang meal-plan-detail
  cancelAdd(): void {
    this.router.navigate(['/meal-plans', this.addMealPlanId]);
  }

  // Lấy số lượng đã chọn cho sản phẩm
  getQuantity(product: Product): number {
    return this.selectedQuantities.get(product.id) || this.getMinQuantity(product);
  }

  // Lấy số lượng tối thiểu (100g cho kg, 1 cho các loại khác)
  getMinQuantity(product: Product): number {
    return utilGetMinQuantity(product.unit);
  }

  // Lấy bước nhảy (step) cho input
  getStep(product: Product): number {
    return getQuantityStep(product.unit);
  }

  // Tăng số lượng
  increaseQuantity(product: Product): void {
    const current = this.getQuantity(product);
    const step = this.getStep(product);
    const max = this.getMaxQuantity(product);
    const newValue = Math.min(current + step, max);
    this.selectedQuantities.set(product.id, newValue);
    this.cdr.markForCheck();
  }

  // Giảm số lượng
  decreaseQuantity(product: Product): void {
    const current = this.getQuantity(product);
    const step = this.getStep(product);
    const minQty = this.getMinQuantity(product);
    const newValue = Math.max(current - step, minQty);
    this.selectedQuantities.set(product.id, newValue);
    this.cdr.markForCheck();
  }

  // Xử lý khi người dùng nhập số lượng qua ngModel
  setQuantity(product: Product, value: number): void {
    const minQty = this.getMinQuantity(product);
    const max = this.getMaxQuantity(product);

    // Cho phép giá trị tạm thời khi đang nhập
    if (value === null || value === undefined || isNaN(value)) {
      return;
    }

    // Giới hạn trong khoảng cho phép
    const clampedValue = Math.max(minQty, Math.min(value, max));
    this.selectedQuantities.set(product.id, clampedValue);
    this.cdr.markForCheck();
  }

  // Lấy số lượng tối đa có thể mua (quy đổi từ kg sang g)
  getMaxQuantity(product: Product): number {
    return convertStockToInputUnit(product.quantityInStock, product.unit);
  }

  // Tính giá dựa trên số lượng đã chọn
  calculatePrice(product: Product): number {
    const quantity = this.getQuantity(product);
    return calculateIngredientPrice(product.price, product.unit, quantity, this.getInputUnit(product));
  }

  // Lấy đơn vị hiển thị cho input (g cho kg, ml cho lít)
  getInputUnit(product: Product): string {
    return utilGetInputUnit(product.unit);
  }

  // Kiểm tra số lượng có thấp hơn tối thiểu không
  isQuantityBelowMin(product: Product, inputValue: string): boolean {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value === 0) return false;
    return value < this.getMinQuantity(product);
  }
}
