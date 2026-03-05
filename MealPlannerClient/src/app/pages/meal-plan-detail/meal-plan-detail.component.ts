import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MealPlanService, ProductForSwap, SwapSuggestion } from '../../services/meal-plan.service';
import { CartService } from '../../services/cart.service';
import { MealPlan, Meal, MealPlanIngredient, MealType, Product } from '../../models/models';
import { calculateIngredientPrice, convertToCartQuantity } from '../../utils/unit-converter';

@Component({
  selector: 'app-meal-plan-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="meal-plan-detail">
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Đang tải thực đơn...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <h2>❌ Lỗi</h2>
          <p>{{ error() }}</p>
          <button (click)="goBack()">← Quay lại</button>
        </div>
      } @else if (mealPlan()) {
        <div class="header">
          <button class="btn-back" (click)="goBack()">← Quay lại</button>
          <div class="header-content">
            <h1>🍽️ Thực đơn ngày {{ mealPlan()!.planDate | date:'dd/MM/yyyy' }}</h1>
            <p class="user-request">{{ mealPlan()!.userRequest }}</p>
          </div>
        </div>

        <div class="meals-container">
          @for (meal of mealPlan()!.meals; track meal.id) {
            <div class="meal-card" [class]="getMealClass(meal.mealType)">
              <div class="meal-header">
                <div class="meal-type-badge">{{ getMealTypeIcon(meal.mealType) }} {{ getMealTypeName(meal.mealType) }}</div>
                <button 
                  class="btn-regenerate" 
                  (click)="regenerateMeal(meal)"
                  [disabled]="regenerating() === meal.id">
                  {{ regenerating() === meal.id ? '⏳ Đang đổi...' : '🔄 Đổi công thức' }}
                </button>
              </div>

              <h2>{{ meal.dishName }}</h2>
              
              @if (meal.description) {
                <p class="description">{{ meal.description }}</p>
              }

              <div class="meta-info">
                @if (meal.prepTime) {
                  <span>⏱️ Chuẩn bị: {{ meal.prepTime }} phút</span>
                }
                @if (meal.cookTime) {
                  <span>🍳 Nấu: {{ meal.cookTime }} phút</span>
                }
                @if (meal.servings) {
                  <span>👥 {{ meal.servings }} phần</span>
                }
                @if (meal.totalCalories) {
                  <span>🔥 {{ meal.totalCalories }} kcal</span>
                }
              </div>

              <div class="recipe-section">
                <h3>📝 Công thức nấu</h3>
                <button class="btn-toggle" (click)="toggleRecipe(meal.id)">
                  {{ expandedRecipes().has(meal.id) ? '▼ Thu gọn' : '▶ Xem công thức' }}
                </button>
                @if (expandedRecipes().has(meal.id)) {
                  <div class="recipe-content">
                    {{ meal.recipe }}
                  </div>
                }
              </div>

              <div class="ingredients-section">
                <h3>🥗 Nguyên liệu</h3>
                <div class="ingredients-list">
                  @for (ing of meal.ingredients; track ing.id) {
                    <div class="ingredient-item" [class.unavailable]="!ing.isMatched">
                      <div class="ingredient-info">
                        <span class="ingredient-name">{{ ing.ingredientName }}</span>
                        <span class="ingredient-qty">{{ ing.quantity }} {{ ing.unit }}</span>
                        @if (ing.notes) {
                          <span class="ingredient-notes">({{ ing.notes }})</span>
                        }
                      </div>
                      <div class="ingredient-actions">
                        <button 
                          class="btn-swap" 
                          (click)="openSwapModal(meal, ing)"
                          [disabled]="swappingIngredient()">
                          {{ swappingIngredient()?.id === ing.id ? '⏳' : '🔄' }} Đổi
                        </button>
                        <button 
                          class="btn-delete" 
                          (click)="deleteIngredient(meal, ing)"
                          title="Xóa nguyên liệu này">
                          🗑️
                        </button>
                        @if (ing.isMatched && ing.product) {
                          <span class="price">{{ getIngredientPrice(ing) | number:'1.0-0' }} đ</span>
                          <button class="btn-add-cart" (click)="addToCart(ing)">
                            🛒 Thêm
                          </button>
                        } @else {
                          <span class="unavailable-badge">Chưa có trong kho</span>
                        }
                      </div>
                    </div>
                  }
                </div>
                <button class="btn-add-ingredient" (click)="openAddModal(meal)">
                  ➕ Thêm nguyên liệu
                </button>
              </div>
            </div>
          }
        </div>

        <div class="summary-footer">
          <div class="summary-info">
            <div class="total-cost">
              <span>Tổng tiền nguyên liệu:</span>
              <strong>{{ totalCost() | number }} đ</strong>
            </div>
            @if (unmatchedCount() > 0) {
              <div class="unmatched-warning">
                ⚠️ Có {{ unmatchedCount() }} nguyên liệu chưa có trong kho
              </div>
            }
          </div>
          <div class="summary-actions">
            <button class="btn-add-all" (click)="addAllToCart()">
              🛒 Thêm tất cả vào giỏ
            </button>
            <button class="btn-order" (click)="orderNow()">
              💳 Đặt hàng ngay
            </button>
          </div>
        </div>
      }

      <!-- Swap Modal -->
      @if (showSwapModal()) {
        <div class="modal-overlay" (click)="closeSwapModal()">
          <div class="swap-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>🔄 Đổi nguyên liệu</h3>
              <button class="btn-close" (click)="closeSwapModal()">✕</button>
            </div>
            <div class="modal-body">
              <p class="current-ingredient">
                Nguyên liệu hiện tại: <strong>{{ swappingIngredient()?.ingredientName }}</strong>
              </p>
              @if (loadingSuggestions()) {
                <div class="loading-suggestions">
                  <div class="spinner-small"></div>
                  <span>Đang tìm gợi ý...</span>
                </div>
              } @else if (swapSuggestions().length > 0) {
                <div class="suggestions-list">
                  @for (suggestion of swapSuggestions(); track suggestion.ingredientName) {
                    <div 
                      class="suggestion-item" 
                      [class.available]="suggestion.isAvailable"
                      (click)="selectSwapIngredient(suggestion)">
                      <div class="suggestion-info">
                        <span class="suggestion-name">{{ suggestion.ingredientName }}</span>
                        <span class="suggestion-qty">{{ suggestion.suggestedQuantity }} {{ suggestion.unit }}</span>
                        @if (suggestion.price) {
                          <span class="suggestion-price">{{ suggestion.price | number:'1.0-0' }} đ</span>
                        }
                      </div>
                      <p class="suggestion-reason">{{ suggestion.reason }}</p>
                      @if (!suggestion.isAvailable) {
                        <span class="not-available">Chưa có sẵn</span>
                      }
                    </div>
                  }
                </div>
              } @else if (swapError()) {
                <p class="swap-error">⚠️ {{ swapError() }}</p>
              } @else {
                <p class="no-suggestions">Không tìm thấy gợi ý thay thế</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .meal-plan-detail {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: calc(100vh - 70px);
      background: #f5f7fa;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-container {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .btn-back {
      padding: 0.75rem 1.25rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-back:hover {
      border-color: #667eea;
      color: #667eea;
    }

    .header-content h1 {
      margin: 0 0 0.5rem;
      color: #333;
    }

    .user-request {
      color: #666;
      font-style: italic;
      margin: 0;
    }

    .meals-container {
      display: grid;
      gap: 1.5rem;
    }

    .meal-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      border-left: 5px solid #667eea;
    }

    .meal-card.breakfast { border-left-color: #f39c12; }
    .meal-card.lunch { border-left-color: #e74c3c; }
    .meal-card.dinner { border-left-color: #9b59b6; }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .meal-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-weight: 600;
    }

    .btn-regenerate {
      padding: 0.5rem 1rem;
      background: white;
      border: 2px solid #667eea;
      border-radius: 8px;
      color: #667eea;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-regenerate:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }

    .btn-regenerate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .meal-card h2 {
      margin: 0 0 0.5rem;
      color: #333;
    }

    .description {
      color: #666;
      margin-bottom: 1rem;
    }

    .meta-info {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      color: #888;
      font-size: 0.9rem;
    }

    .recipe-section {
      margin-bottom: 1.5rem;
    }

    .recipe-section h3 {
      margin: 0 0 0.75rem;
      color: #333;
    }

    .btn-toggle {
      padding: 0.5rem 1rem;
      background: #f5f5f5;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-toggle:hover {
      background: #e0e0e0;
    }

    .recipe-content {
      margin-top: 1rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      line-height: 1.8;
      white-space: pre-wrap;
    }

    .ingredients-section h3 {
      margin: 0 0 1rem;
      color: #333;
    }

    .ingredients-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ingredient-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f9f9f9;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .ingredient-item:hover {
      background: #f0f0f0;
    }

    .ingredient-item.unavailable {
      background: #fff5f5;
      border: 1px dashed #e74c3c;
    }

    .ingredient-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .ingredient-name {
      font-weight: 600;
      color: #333;
    }

    .ingredient-qty {
      color: #666;
    }

    .ingredient-notes {
      color: #888;
      font-size: 0.85rem;
      font-style: italic;
    }

    .ingredient-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .price {
      font-weight: 600;
      color: #27ae60;
    }

    .btn-add-cart {
      padding: 0.4rem 0.75rem;
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: transform 0.2s;
    }

    .btn-add-cart:hover {
      transform: scale(1.05);
    }

    .unavailable-badge {
      padding: 0.25rem 0.75rem;
      background: #ffe6e6;
      color: #e74c3c;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .summary-footer {
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      padding: 1.5rem 2rem;
      border-top: 1px solid #eee;
      margin: 2rem -2rem -2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    }

    .total-cost {
      font-size: 1.25rem;
    }

    .total-cost strong {
      color: #27ae60;
      margin-left: 0.5rem;
    }

    .unmatched-warning {
      color: #e67e22;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .summary-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-add-all, .btn-order {
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-add-all {
      background: white;
      border: 2px solid #27ae60;
      color: #27ae60;
    }

    .btn-add-all:hover {
      background: #27ae60;
      color: white;
    }

    .btn-order {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-order:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    /* Swap Button */
    .btn-swap {
      padding: 0.4rem 0.75rem;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .btn-swap:hover:not(:disabled) {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .btn-swap:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Delete Button */
    .btn-delete {
      padding: 0.4rem 0.6rem;
      background: #fff5f5;
      border: 1px solid #e74c3c;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .btn-delete:hover {
      background: #e74c3c;
      color: white;
    }

    /* Add Ingredient Button */
    .btn-add-ingredient {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 2px dashed #27ae60;
      border-radius: 8px;
      color: #27ae60;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      width: 100%;
      transition: all 0.2s;
    }

    .btn-add-ingredient:hover {
      background: #27ae60;
      color: white;
      border-style: solid;
    }

    .search-box {
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .swap-modal {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .modal-header h3 {
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      max-height: 60vh;
    }

    .current-ingredient {
      margin: 0 0 1rem;
      color: #666;
    }

    .loading-suggestions {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: center;
      padding: 2rem;
    }

    .spinner-small {
      width: 24px;
      height: 24px;
      border: 3px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .suggestion-item {
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .suggestion-item:hover {
      background: #f0f0f0;
      border-color: #667eea;
    }

    .suggestion-item.available {
      border-left: 4px solid #27ae60;
    }

    .suggestion-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .suggestion-name {
      font-weight: 600;
      color: #333;
    }

    .suggestion-qty {
      color: #666;
    }

    .suggestion-price {
      color: #27ae60;
      font-weight: 600;
    }

    .suggestion-reason {
      margin: 0.5rem 0 0;
      color: #888;
      font-size: 0.9rem;
      font-style: italic;
    }

    .not-available {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: #ffe6e6;
      color: #e74c3c;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .no-suggestions {
      text-align: center;
      color: #888;
      padding: 2rem;
    }

    .swap-error {
      text-align: center;
      color: #e74c3c;
      background: #ffe6e6;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
    @media (max-width: 768px) {
      .meal-plan-detail {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
      }

      .meal-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .ingredient-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .ingredient-actions {
        width: 100%;
        justify-content: space-between;
      }

      .summary-footer {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .summary-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn-add-all, .btn-order {
        width: 100%;
      }
    }
  `]
})
export class MealPlanDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mealPlanService = inject(MealPlanService);
  private cartService = inject(CartService);

  mealPlan = signal<MealPlan | null>(null);
  loading = signal(true);
  error = signal('');
  regenerating = signal<number | null>(null);
  expandedRecipes = signal<Set<number>>(new Set());

  // Swap ingredient state
  showSwapModal = signal(false);
  swappingIngredient = signal<MealPlanIngredient | null>(null);
  swappingMeal = signal<Meal | null>(null);
  swapSuggestions = signal<SwapSuggestion[]>([]);
  loadingSuggestions = signal(false);
  swapError = signal('');

  totalCost = computed(() => {
    const plan = this.mealPlan();
    if (!plan) return 0;

    let total = 0;
    for (const meal of plan.meals) {
      for (const ing of meal.ingredients) {
        if (ing.isMatched && ing.product) {
          total += this.calculatePrice(ing);
        }
      }
    }
    return total;
  });

  unmatchedCount = computed(() => {
    const plan = this.mealPlan();
    if (!plan) return 0;

    let count = 0;
    for (const meal of plan.meals) {
      for (const ing of meal.ingredients) {
        if (!ing.isMatched) count++;
      }
    }
    return count;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMealPlan(+id);

      // Check for swap/add complete params
      this.route.queryParams.subscribe(params => {
        if (params['swapComplete'] === 'true') {
          this.applySwap(
            +params['mealId'],
            +params['ingredientId'],
            +params['newProductId'],
            params['newProductName'],
            +params['newQuantity'],
            params['newUnit'],
            params['productUnit'] || 'kg',
            +params['newPrice']
          );
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        }
        if (params['addComplete'] === 'true') {
          this.applyAdd(
            +params['mealId'],
            +params['productId'],
            +params['quantity'],
            params['unit']
          );
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        }
      });
    } else {
      this.error.set('Invalid meal plan ID');
      this.loading.set(false);
    }
  }

  // Apply swap ingredient - now persists to DB
  applySwap(mealId: number, ingredientId: number, productId: number, productName: string, quantity: number, unit: string, productUnit: string, price: number): void {
    // Wait for meal plan to load first
    setTimeout(() => {
      this.mealPlanService.swapIngredient(ingredientId, {
        productId,
        productName,
        quantity,
        unit
      }).subscribe({
        next: () => {
          // Reload meal plan from server to get fresh data
          const plan = this.mealPlan();
          if (plan) this.loadMealPlan(plan.id);
          alert(`✅ Đã thay thế nguyên liệu bằng "${productName}"!`);
        },
        error: () => {
          alert('❌ Không thể đổi nguyên liệu. Vui lòng thử lại.');
        }
      });
    }, 500);
  }

  loadMealPlan(id: number): void {
    this.loading.set(true);
    this.mealPlanService.getMealPlan(id).subscribe({
      next: (response: unknown) => {
        const res = response as { success?: boolean; data?: MealPlan };
        if (res.data) {
          this.mealPlan.set(res.data);
        } else {
          this.mealPlan.set(response as MealPlan);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể tải thực đơn');
        this.loading.set(false);
      }
    });
  }

  getMealTypeName(type: MealType | string): string {
    const typeStr = typeof type === 'string' ? type : MealType[type];
    switch (typeStr) {
      case 'Breakfast': return 'Bữa sáng';
      case 'Lunch': return 'Bữa trưa';
      case 'Dinner': return 'Bữa tối';
      case 'Snack': return 'Bữa phụ';
      default: return 'Bữa ăn';
    }
  }

  getMealTypeIcon(type: MealType | string): string {
    const typeStr = typeof type === 'string' ? type : MealType[type];
    switch (typeStr) {
      case 'Breakfast': return '🌅';
      case 'Lunch': return '☀️';
      case 'Dinner': return '🌙';
      case 'Snack': return '🍪';
      default: return '🍽️';
    }
  }

  getMealClass(type: MealType | string): string {
    const typeStr = typeof type === 'string' ? type : MealType[type];
    switch (typeStr) {
      case 'Breakfast': return 'breakfast';
      case 'Lunch': return 'lunch';
      case 'Dinner': return 'dinner';
      default: return '';
    }
  }

  toggleRecipe(mealId: number): void {
    const current = new Set(this.expandedRecipes());
    if (current.has(mealId)) {
      current.delete(mealId);
    } else {
      current.add(mealId);
    }
    this.expandedRecipes.set(current);
  }

  regenerateMeal(meal: Meal): void {
    const plan = this.mealPlan();
    if (!plan) return;

    this.regenerating.set(meal.id);
    this.mealPlanService.regenerateMeal(plan.id, meal.id).subscribe({
      next: (response: unknown) => {
        const res = response as { success?: boolean; data?: MealPlan };
        if (res.data) {
          this.mealPlan.set(res.data);
        } else {
          this.mealPlan.set(response as MealPlan);
        }
        this.regenerating.set(null);
      },
      error: () => {
        this.regenerating.set(null);
        alert('Không thể đổi công thức. Vui lòng thử lại.');
      }
    });
  }

  deleteIngredient(meal: Meal, ingredient: MealPlanIngredient): void {
    if (!confirm(`Bạn có chắc muốn xóa "${ingredient.ingredientName}" khỏi món ăn?`)) {
      return;
    }

    const plan = this.mealPlan();
    if (!plan) return;

    // Call API to delete from DB, then update local state
    this.mealPlanService.deleteIngredient(ingredient.id).subscribe({
      next: () => {
        const updatedMeals = plan.meals.map(m => {
          if (m.id === meal.id) {
            return {
              ...m,
              ingredients: m.ingredients.filter(ing => ing.id !== ingredient.id)
            };
          }
          return m;
        });
        this.mealPlan.set({ ...plan, meals: updatedMeals });
        alert(`Đã xóa "${ingredient.ingredientName}" khỏi công thức!`);
      },
      error: () => {
        alert('❌ Không thể xóa nguyên liệu. Vui lòng thử lại.');
      }
    });
  }

  addToCart(ing: MealPlanIngredient): void {
    if (ing.product) {
      // Chuyển đổi số lượng từ đơn vị nguyên liệu sang đơn vị cart
      // VD: 3 quả trứng → 1 chục, 200g thịt → 200g
      const cartQty = convertToCartQuantity(ing.quantity, ing.unit, ing.product.unit);
      this.cartService.addToCart(ing.product, cartQty);
      alert(`Đã thêm ${ing.product.name} (${ing.quantity} ${ing.unit}) vào giỏ hàng!`);
    }
  }

  addAllToCart(): void {
    const plan = this.mealPlan();
    if (!plan) return;

    let count = 0;
    for (const meal of plan.meals) {
      for (const ing of meal.ingredients) {
        if (ing.isMatched && ing.product) {
          const cartQty = convertToCartQuantity(ing.quantity, ing.unit, ing.product.unit);
          this.cartService.addToCart(ing.product, cartQty);
          count++;
        }
      }
    }
    alert(`Đã thêm ${count} sản phẩm vào giỏ hàng!`);
  }

  orderNow(): void {
    const plan = this.mealPlan();
    if (plan) {
      this.router.navigate(['/checkout'], { queryParams: { mealPlanId: plan.id } });
    }
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }

  // Tính giá nguyên liệu với quy đổi đơn vị
  getIngredientPrice(ing: MealPlanIngredient): number {
    return this.calculatePrice(ing);
  }

  calculatePrice(ing: MealPlanIngredient): number {
    if (!ing.product) return 0;
    return calculateIngredientPrice(
      ing.product.price,
      ing.product.unit,
      ing.quantity,
      ing.unit
    );
  }

  // ========== Swap Ingredient Methods ==========

  openSwapModal(meal: Meal, ingredient: MealPlanIngredient): void {
    // Navigate đến trang sản phẩm với swap params
    const plan = this.mealPlan();
    if (!plan) return;

    this.router.navigate(['/products'], {
      queryParams: {
        swapMode: true,
        mealPlanId: plan.id,
        mealId: meal.id,
        ingredientId: ingredient.id,
        ingredientName: ingredient.ingredientName,
        quantity: ingredient.quantity,
        unit: ingredient.unit || 'g'
      }
    });
  }

  closeSwapModal(): void {
    this.showSwapModal.set(false);
    this.swappingIngredient.set(null);
    this.swappingMeal.set(null);
    this.swapSuggestions.set([]);
  }

  selectSwapIngredient(suggestion: SwapSuggestion): void {
    const meal = this.swappingMeal();
    const ingredient = this.swappingIngredient();
    const plan = this.mealPlan();

    if (!meal || !ingredient || !plan) return;

    if (!suggestion.isAvailable || !suggestion.productId) {
      alert('Nguyên liệu này chưa có sẵn trong kho.');
      return;
    }

    // Call API to persist swap, then update local state
    this.mealPlanService.swapIngredient(ingredient.id, {
      productId: suggestion.productId,
      productName: suggestion.ingredientName,
      quantity: suggestion.suggestedQuantity,
      unit: suggestion.unit
    }).subscribe({
      next: () => {
        // Reload from server for fresh data
        this.loadMealPlan(plan.id);
        this.closeSwapModal();
        alert(`Đã đổi ${ingredient.ingredientName} thành ${suggestion.ingredientName}!`);
      },
      error: () => {
        alert('❌ Không thể đổi nguyên liệu. Vui lòng thử lại.');
      }
    });
  }

  // ========== Add Ingredient Methods ==========

  openAddModal(meal: Meal): void {
    const plan = this.mealPlan();
    if (!plan) return;

    this.router.navigate(['/products'], {
      queryParams: {
        addMode: true,
        mealPlanId: plan.id,
        mealId: meal.id,
        mealName: meal.dishName
      }
    });
  }

  applyAdd(mealId: number, productId: number, quantity: number, unit: string): void {
    setTimeout(() => {
      this.mealPlanService.addIngredient(mealId, {
        productId,
        quantity,
        unit
      }).subscribe({
        next: () => {
          const plan = this.mealPlan();
          if (plan) this.loadMealPlan(plan.id);
          alert('✅ Đã thêm nguyên liệu vào công thức!');
        },
        error: () => {
          alert('❌ Không thể thêm nguyên liệu. Vui lòng thử lại.');
        }
      });
    }, 500);
  }
}

