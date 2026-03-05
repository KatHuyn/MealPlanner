import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { MealPlanService } from '../../services/meal-plan.service';
import { AuthService } from '../../services/auth.service';
import { CartItem, MealPlan, OrderItemRequest } from '../../models/models';
import { calculateIngredientPrice } from '../../utils/unit-converter';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="checkout-container">
      <h1>💳 Thanh toán</h1>

      <div class="checkout-content">
        <div class="checkout-form">
          <div class="section">
            <h3>📦 Thông tin giao hàng</h3>
            
            <div class="form-group">
              <label for="receiverName">Họ tên người nhận</label>
              <input type="text" id="receiverName" [(ngModel)]="receiverName" required>
            </div>

            <div class="form-group">
              <label for="receiverPhone">Số điện thoại</label>
              <input type="tel" id="receiverPhone" [(ngModel)]="receiverPhone" required>
            </div>

            <div class="form-group">
              <label for="shippingAddress">Địa chỉ giao hàng</label>
              <textarea id="shippingAddress" [(ngModel)]="shippingAddress" rows="3" required></textarea>
            </div>

            <div class="form-group">
              <label for="notes">Ghi chú</label>
              <textarea id="notes" [(ngModel)]="notes" rows="2" placeholder="Ghi chú thêm cho đơn hàng..."></textarea>
            </div>
          </div>

          <div class="section">
            <h3>💳 Phương thức thanh toán</h3>
            <div class="payment-methods">
              <label class="payment-option" [class.selected]="paymentMethod === 'COD'">
                <input type="radio" name="paymentMethod" value="COD" [(ngModel)]="paymentMethod">
                <span class="radio-custom"></span>
                <div class="payment-info">
                  <span class="payment-name">💵 Thanh toán khi nhận hàng (COD)</span>
                  <span class="payment-desc">Thanh toán tiền mặt khi nhận được hàng</span>
                </div>
              </label>
              <label class="payment-option" [class.selected]="paymentMethod === 'BankTransfer'">
                <input type="radio" name="paymentMethod" value="BankTransfer" [(ngModel)]="paymentMethod">
                <span class="radio-custom"></span>
                <div class="payment-info">
                  <span class="payment-name">🏦 Chuyển khoản ngân hàng</span>
                  <span class="payment-desc">Chuyển khoản trước khi giao hàng</span>
                </div>
              </label>
            </div>

            @if (paymentMethod === 'BankTransfer') {
              <div class="bank-info">
                <h4>🏦 Thông tin chuyển khoản MBBank</h4>
                <div class="bank-qr">
                  <img src="qr-mbbank.png" alt="QR Code MBBank" class="qr-code" 
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  <div class="qr-placeholder" style="display:none;">
                    <span>📱</span>
                    <p>QR Code sẽ được cập nhật</p>
                  </div>
                </div>
                <div class="bank-details">
                  <p><strong>Ngân hàng:</strong> MBBank (Quân đội)</p>
                  <p><strong>Số tài khoản:</strong> 0123456789</p>
                  <p><strong>Chủ tài khoản:</strong> MEAL PLANNER</p>
                  <p><strong>Nội dung CK:</strong> <span class="ck-content">MP {{ receiverPhone || 'SDT' }}</span></p>
                </div>
                <p class="bank-note">⚠️ Quét mã QR hoặc chuyển khoản đúng nội dung để được xử lý nhanh.</p>
              </div>
            }
          </div>

          @if (mealPlan) {
            <div class="section">
              <h3>🍽️ Đặt từ thực đơn</h3>
              <div class="meal-plan-info">
                <p><strong>Thực đơn ngày:</strong> {{ mealPlan.planDate | date:'dd/MM/yyyy' }}</p>
                <p><strong>Yêu cầu:</strong> {{ mealPlan.userRequest }}</p>
                <ul>
                  @for (meal of mealPlan.meals; track meal.id) {
                    <li>{{ getMealTypeName(meal.mealType) }}: {{ meal.dishName }}</li>
                  }
                </ul>
              </div>
            </div>
          }

          @if (cartItems.length > 0 && !mealPlan) {
            <div class="section">
              <h3>🛒 Sản phẩm trong giỏ</h3>
              <div class="cart-preview">
                @for (item of cartItems; track item.product.id) {
                  <div class="cart-preview-item">
                    <span>{{ item.product.name }}</span>
                    <span>{{ item.quantity }}{{ getInputUnit(item.product) }}</span>
                    <span>{{ calculateCartItemPrice(item) | number }} đ</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="checkout-summary">
          <h3>📋 Tóm tắt đơn hàng</h3>
          
          <div class="summary-row">
            <span>Tạm tính:</span>
            <span>{{ subtotal | number }} đ</span>
          </div>
          <div class="summary-row">
            <span>Phí giao hàng:</span>
            <span>{{ shippingFee | number }} đ</span>
          </div>
          <div class="summary-row total">
            <span>Tổng cộng:</span>
            <span>{{ subtotal + shippingFee | number }} đ</span>
          </div>

          @if (error) {
            <div class="error">{{ error }}</div>
          }

          <button class="btn-place-order" [disabled]="loading || !isFormValid()" (click)="placeOrder()">
            {{ loading ? 'Đang xử lý...' : 'Đặt hàng' }}
          </button>

          <p class="terms">
            Bằng việc đặt hàng, bạn đồng ý với 
            <a href="#">điều khoản sử dụng</a> của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 2rem; }

    .checkout-content { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; }

    .section {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
    }

    .section h3 { margin: 0 0 1.25rem; color: #333; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }

    input, textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    input:focus, textarea:focus { outline: none; border-color: #667eea; }
    textarea { resize: vertical; }

    .meal-plan-info { background: #f9f9f9; padding: 1rem; border-radius: 8px; }
    .meal-plan-info p { margin: 0 0 0.5rem; }
    .meal-plan-info ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }

    .cart-preview-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

    .cart-preview-item:last-child { border-bottom: none; }

    .checkout-summary {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      height: fit-content;
      position: sticky;
      top: 90px;
    }

    .checkout-summary h3 { margin: 0 0 1.5rem; color: #333; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; color: #666; }

    .summary-row.total {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #eee;
      font-size: 1.25rem;
      font-weight: bold;
      color: #333;
    }

    .summary-row.total span:last-child { color: #27ae60; }

    .error {
      background: #ffe6e6;
      color: #d63031;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .btn-place-order {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-place-order:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4);
    }

    .btn-place-order:disabled { opacity: 0.7; cursor: not-allowed; }
    .terms { text-align: center; margin-top: 1rem; font-size: 0.8rem; color: #888; }
    .terms a { color: #667eea; text-decoration: none; }

    /* Payment Methods */
    .payment-methods { display: flex; flex-direction: column; gap: 0.75rem; }
    
    .payment-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .payment-option:hover { border-color: #667eea; background: #f8f9ff; }
    .payment-option.selected { border-color: #667eea; background: #f0f3ff; }
    
    .payment-option input[type="radio"] { display: none; }
    
    .radio-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #ccc;
      border-radius: 50%;
      position: relative;
      flex-shrink: 0;
    }
    
    .payment-option.selected .radio-custom {
      border-color: #667eea;
    }
    
    .payment-option.selected .radio-custom::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: #667eea;
      border-radius: 50%;
    }
    
    .payment-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .payment-name { font-weight: 600; color: #333; }
    .payment-desc { font-size: 0.8rem; color: #888; }

    /* Bank Info */
    .bank-info {
      margin-top: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border: 2px solid #4caf50;
      border-radius: 12px;
    }
    
    .bank-info h4 { margin: 0 0 0.75rem; color: #2e7d32; }
    
    .bank-qr {
      text-align: center;
      margin-bottom: 0.75rem;
    }
    
    .qr-code {
      width: 180px;
      height: 180px;
      border-radius: 8px;
      border: 2px solid #4caf50;
    }
    
    .qr-placeholder {
      width: 180px;
      height: 180px;
      margin: 0 auto;
      background: #f5f5f5;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #888;
    }
    
    .qr-placeholder span { font-size: 3rem; }
    .qr-placeholder p { margin: 0.5rem 0 0; font-size: 0.8rem; }
    
    .bank-details {
      background: white;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }
    
    .bank-details p { margin: 0.25rem 0; color: #333; font-size: 0.9rem; }
    
    .ck-content {
      background: #fff3cd;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      color: #856404;
    }
    
    .bank-note {
      margin: 0;
      font-size: 0.8rem;
      color: #f57c00;
    }

    @media (max-width: 768px) { .checkout-content { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  mealPlan: MealPlan | null = null;
  mealPlanId: number | null = null;

  receiverName = '';
  receiverPhone = '';
  shippingAddress = '';
  notes = '';
  paymentMethod = 'COD'; // COD or BankTransfer

  shippingFee = 30000; // Khớp với backend CalculateShippingFee: 30,000đ cho đơn < 500,000đ
  loading = false;
  error = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private mealPlanService: MealPlanService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.receiverName = user.fullName;
      this.receiverPhone = user.phone || '';
    }

    this.route.queryParams.subscribe(params => {
      if (params['mealPlanId']) {
        this.mealPlanId = +params['mealPlanId'];
        this.loadMealPlan(this.mealPlanId);
      } else {
        this.cartService.cartItems$.subscribe(items => this.cartItems = items);
      }
    });
  }

  loadMealPlan(id: number): void {
    this.mealPlanService.getMealPlan(id).subscribe({
      next: (plan) => {
        this.mealPlan = plan;
      },
      error: () => {
        this.error = 'Không tìm thấy thực đơn';
      }
    });
  }

  get subtotal(): number {
    // Nếu đang thanh toán từ meal plan
    if (this.mealPlan) {
      // Ưu tiên dùng totalCost từ API (đã tính sẵn)
      if (this.mealPlan.totalCost && this.mealPlan.totalCost > 0) {
        return this.mealPlan.totalCost;
      }

      // Fallback: Tính lại nếu API không có totalCost
      let total = 0;
      this.mealPlan.meals?.forEach(meal => {
        meal.ingredients?.forEach(ing => {
          if (ing.product) {
            total += calculateIngredientPrice(
              ing.product.price,
              ing.product.unit,
              ing.quantity,
              ing.unit
            );
          }
        });
      });
      return total;
    }
    // Nếu thanh toán từ giỏ hàng
    return this.cartService.getTotal();
  }

  getMealTypeName(type: number): string {
    switch (type) {
      case 0: return '🌅 Sáng';
      case 1: return '☀️ Trưa';
      case 2: return '🌙 Tối';
      default: return 'Bữa ăn';
    }
  }

  calculateCartItemPrice(item: CartItem): number {
    // CartItem có quantity tính bằng g (ví dụ: 1100g)
    // Product có price tính theo kg (ví dụ: 70,000đ/kg)
    return calculateIngredientPrice(
      item.product.price,
      item.product.unit,
      item.quantity,
      'g' // Cart items luôn nhập theo g
    );
  }

  getInputUnit(product: { unit?: string }): string {
    const unit = (product.unit || 'kg').toLowerCase();
    if (unit === 'kg' || unit === 'kilogram') return 'g';
    if (unit === 'l' || unit === 'lít' || unit === 'liter') return 'ml';
    return unit;
  }

  isFormValid(): boolean {
    return !!(this.receiverName && this.receiverPhone && this.shippingAddress &&
      (this.mealPlan || this.cartItems.length > 0));
  }

  placeOrder(): void {
    if (!this.isFormValid()) return;

    this.loading = true;
    this.error = '';

    if (this.mealPlanId) {
      console.log('[Checkout] Creating order from meal plan:', this.mealPlanId);
      this.orderService.createOrderFromMealPlan(this.mealPlanId, {
        shippingAddress: this.shippingAddress,
        receiverPhone: this.receiverPhone,
        receiverName: this.receiverName,
        notes: this.notes,
        paymentMethod: this.paymentMethod
      }).subscribe({
        next: (order) => {
          console.log('[Checkout] Order created successfully:', order);
          this.loading = false;
          this.cartService.clearCart();
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          console.error('[Checkout] Order creation failed:', err);
          this.error = err.error?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
          this.loading = false;
        }
      });
    } else {
      const items: OrderItemRequest[] = this.cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      console.log('[Checkout] Creating order from cart:', items);
      this.orderService.createOrder({
        shippingAddress: this.shippingAddress,
        receiverPhone: this.receiverPhone,
        receiverName: this.receiverName,
        notes: this.notes,
        paymentMethod: this.paymentMethod,
        items
      }).subscribe({
        next: (order) => {
          console.log('[Checkout] Cart order created successfully:', order);
          this.loading = false;
          this.cartService.clearCart();
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          console.error('[Checkout] Cart order creation failed:', err);
          this.error = err.error?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
          this.loading = false;
        }
      });
    }
  }
}
