import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-container">
      <h1>🛒 Giỏ hàng</h1>

      @if (cartItems.length > 0) {
        <div class="cart-content">
          <div class="cart-items">
            @for (item of cartItems; track item.product.id) {
              <div class="cart-item">
                <div class="item-image">
                  <img [src]="item.product.imageUrl || 'https://placehold.co/80x80/f5f5f5/999'" [alt]="item.product.name">
                </div>
                <div class="item-info">
                  <h3>{{ item.product.name }}</h3>
                  <p class="item-category">{{ item.product.category }}</p>
                  <p class="item-price">{{ item.product.price | number }} đ/{{ item.product.unit }}</p>
                </div>
                <div class="item-quantity">
                  <button (click)="updateQuantity(item.product.id, item.quantity - 1)">-</button>
                  <span>{{ item.quantity }}{{ getInputUnit(item.product) }}</span>
                  <button (click)="updateQuantity(item.product.id, item.quantity + 1)">+</button>
                </div>
                <div class="item-total">{{ cartService.getItemPrice(item) | number:'1.0-0' }} đ</div>
                <button class="btn-remove" (click)="removeItem(item.product.id)">🗑️</button>
              </div>
            }
          </div>

          <div class="cart-summary">
            <h3>Tóm tắt đơn hàng</h3>
            <div class="min-order-note">
              ⚠️ Đặt hàng tối thiểu: <strong>100g</strong> cho sản phẩm tính theo kg
            </div>
            <div class="summary-row">
              <span>Số sản phẩm:</span>
              <span>{{ cartService.getItemCount() }}</span>
            </div>
            <div class="summary-row">
              <span>Tạm tính:</span>
              <span>{{ cartService.getTotal() | number }} đ</span>
            </div>
            <div class="summary-row total">
              <span>Tổng cộng:</span>
              <span>{{ cartService.getTotal() | number }} đ</span>
            </div>
            
            <button class="btn-checkout" routerLink="/checkout">Tiến hành thanh toán</button>
            <button class="btn-clear" (click)="clearCart()">Xóa giỏ hàng</button>
          </div>
        </div>
      } @else {
        <div class="empty-cart">
          <div class="empty-icon">🛒</div>
          <h2>Giỏ hàng trống</h2>
          <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
          <button routerLink="/products" class="btn-shop">Tiếp tục mua sắm</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 2rem; }

    .cart-content { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }

    .cart-items {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #eee;
    }

    .cart-item:last-child { border-bottom: none; }

    .item-image { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; }
    .item-image img { width: 100%; height: 100%; object-fit: cover; }
    .item-info { flex: 1; }
    .item-info h3 { margin: 0 0 0.25rem; color: #333; }
    .item-category { color: #888; font-size: 0.875rem; margin: 0; }
    .item-price { color: #667eea; font-weight: 600; margin: 0.25rem 0 0; }
    .item-quantity { display: flex; align-items: center; gap: 0.75rem; }

    .item-quantity button {
      width: 32px;
      height: 32px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .item-quantity button:hover { border-color: #667eea; color: #667eea; }
    .item-quantity span { min-width: 40px; text-align: center; font-weight: 600; }
    .item-total { font-weight: bold; color: #27ae60; min-width: 100px; text-align: right; }

    .btn-remove {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.5rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .btn-remove:hover { opacity: 1; }

    .cart-summary {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      height: fit-content;
    }

    .cart-summary h3 { margin: 0 0 1rem; color: #333; }
    
    .min-order-note {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
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

    .btn-checkout {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-checkout:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-clear {
      width: 100%;
      padding: 0.75rem;
      background: transparent;
      color: #e74c3c;
      border: 2px solid #e74c3c;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      margin-top: 0.75rem;
      transition: all 0.2s;
    }

    .btn-clear:hover { background: #e74c3c; color: white; }

    .empty-cart {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .empty-icon { font-size: 5rem; margin-bottom: 1rem; }
    .empty-cart h2 { color: #333; margin-bottom: 0.5rem; }
    .empty-cart p { color: #666; margin-bottom: 2rem; }

    .btn-shop {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 768px) { .cart-content { grid-template-columns: 1fr; } }
  `]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];

  constructor(public cartService: CartService) { }

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => this.cartItems = items);
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  getInputUnit(product: { unit?: string }): string {
    const unit = (product.unit || 'kg').toLowerCase();
    if (unit === 'kg' || unit === 'kilogram') return 'g';
    if (unit === 'l' || unit === 'lít' || unit === 'liter') return 'ml';
    return unit;
  }
}
