import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order, OrderStatus, PaymentStatus } from '../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="orders-container">
      <h1>📋 Đơn hàng của tôi</h1>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Đang tải...</p>
        </div>
      }

      @if (!loading && orders.length === 0) {
        <div class="empty-orders">
          <span class="icon">📦</span>
          <h2>Chưa có đơn hàng</h2>
          <p>Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
          <a routerLink="/products" class="btn-shop">Mua sắm ngay</a>
        </div>
      }

      @if (!loading && orders.length > 0) {
        <div class="orders-list">
          @for (order of orders; track order.id) {
            <div class="order-card" (click)="toggleOrderDetails(order.id)">
              <div class="order-header">
                <div class="order-id">
                  <span class="label">Đơn hàng</span>
                  <span class="value">#{{ order.id }}</span>
                </div>
                <div class="order-date">
                  {{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="order-status">
                  <span [class]="'status ' + getStatusClass(order.status)">
                    {{ getStatusName(order.status) }}
                  </span>
                </div>
                <div class="order-total">
                  <span class="value">{{ order.totalAmount | number }} đ</span>
                </div>
                <span class="expand-icon">{{ expandedOrders.has(order.id) ? '▲' : '▼' }}</span>
              </div>

              @if (expandedOrders.has(order.id)) {
                <div class="order-details">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">📍 Địa chỉ giao hàng</span>
                      <span class="value">{{ order.shippingAddress }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">📞 Số điện thoại</span>
                      <span class="value">{{ order.receiverPhone }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">👤 Người nhận</span>
                      <span class="value">{{ order.receiverName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">💳 Thanh toán</span>
                      <span class="value payment">
                        {{ getPaymentMethodName(order.paymentMethod) }}
                      </span>
                    </div>
                  </div>

                  @if (order.notes) {
                    <div class="order-notes">
                      <span class="label">📝 Ghi chú:</span> {{ order.notes }}
                    </div>
                  }

                  <div class="items-section">
                    <h4>Sản phẩm</h4>
                    <div class="items-list">
                      @for (item of order.items; track item.id) {
                        <div class="item-row">
                          <span class="item-name">{{ item.productName }}</span>
                          <span class="item-qty">x{{ item.quantity }}</span>
                          <span class="item-price">{{ item.totalPrice | number }} đ</span>
                        </div>
                      }
                    </div>
                    <div class="items-total">
                      <span>Tổng cộng:</span>
                      <span>{{ order.totalAmount | number }} đ</span>
                    </div>
                  </div>

                  @if (order.status === 'Pending' || order.status === 0) {
                    <div class="order-actions">
                      <button class="btn-cancel" (click)="cancelOrder(order.id, $event)">
                        Hủy đơn hàng
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 2rem; }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #eee;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-orders {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .empty-orders .icon { font-size: 4rem; }
    .empty-orders h2 { margin: 1rem 0 0.5rem; color: #333; }
    .empty-orders p { color: #666; margin-bottom: 1.5rem; }

    .btn-shop {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }

    .order-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      margin-bottom: 1rem;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.3s;
    }

    .order-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.12); }

    .order-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.25rem 1.5rem;
      background: #fafafa;
    }

    .order-header .label { font-size: 0.75rem; color: #999; display: block; }
    .order-header .value { font-weight: 600; color: #333; }
    .order-id .value { color: #667eea; font-size: 1.1rem; }
    .order-date { color: #666; flex: 1; }

    .status {
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status.pending { background: #fff3cd; color: #856404; }
    .status.confirmed { background: #d1ecf1; color: #0c5460; }
    .status.preparing { background: #e2e3ff; color: #667eea; }
    .status.shipping { background: #d4edda; color: #155724; }
    .status.delivered { background: #27ae60; color: white; }
    .status.cancelled { background: #f8d7da; color: #721c24; }

    .order-total .value { color: #27ae60; font-size: 1.1rem; }
    .expand-icon { color: #999; font-size: 0.75rem; }

    .order-details { padding: 1.5rem; border-top: 1px solid #eee; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .info-item .label { font-size: 0.75rem; color: #999; display: block; margin-bottom: 0.25rem; }
    .info-item .value { color: #333; }
    .payment.paid { color: #27ae60; font-weight: 600; }
    .payment.pending { color: #f39c12; font-weight: 600; }
    .payment.failed { color: #e74c3c; font-weight: 600; }

    .order-notes {
      background: #f9f9f9;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .order-notes .label { font-weight: 600; }

    .items-section { margin-top: 1rem; }
    .items-section h4 { margin: 0 0 0.75rem; color: #333; }

    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

    .item-name { flex: 1; }
    .item-qty { width: 60px; text-align: center; color: #666; }
    .item-price { width: 120px; text-align: right; font-weight: 600; }

    .items-total {
      display: flex;
      justify-content: space-between;
      padding: 1rem 0 0;
      font-size: 1.1rem;
      font-weight: bold;
      color: #27ae60;
    }

    .order-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
      text-align: right;
    }

    .btn-cancel {
      padding: 0.625rem 1.25rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }

    .btn-cancel:hover { background: #c0392b; }

    @media (max-width: 768px) {
      .order-header { flex-wrap: wrap; }
      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  expandedOrders = new Set<number>();

  private cdr = inject(ChangeDetectorRef);
  private orderService = inject(OrderService);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (response: unknown) => {
        const res = response as { success?: boolean; data?: Order[] };
        const orders = res.data ?? (response as Order[]);
        this.orders = orders.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleOrderDetails(orderId: number): void {
    if (this.expandedOrders.has(orderId)) {
      this.expandedOrders.delete(orderId);
    } else {
      this.expandedOrders.add(orderId);
    }
  }

  getStatusClass(status: OrderStatus | string): string {
    // Handle string status from API
    if (typeof status === 'string') {
      const stringMap: { [key: string]: string } = {
        'Pending': 'pending',
        'Confirmed': 'confirmed',
        'Processing': 'preparing',
        'Shipping': 'shipping',
        'Shipped': 'shipping',
        'Delivered': 'delivered',
        'Cancelled': 'cancelled'
      };
      return stringMap[status] || 'pending';
    }
    // Handle number status
    const statusMap: { [key: number]: string } = {
      0: 'pending',
      1: 'confirmed',
      2: 'preparing',
      3: 'shipping',
      4: 'delivered',
      5: 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  getStatusName(status: OrderStatus | string): string {
    // Handle string status from API
    if (typeof status === 'string') {
      const stringMap: { [key: string]: string } = {
        'Pending': 'Chờ xác nhận',
        'Confirmed': 'Đã xác nhận',
        'Processing': 'Đang chuẩn bị',
        'Shipping': 'Đang giao',
        'Shipped': 'Đã giao',
        'Delivered': 'Đã giao',
        'Cancelled': 'Đã hủy'
      };
      return stringMap[status] || status; // Return the string itself if not mapped
    }
    // Handle number status
    const statusMap: { [key: number]: string } = {
      0: 'Chờ xác nhận',
      1: 'Đã xác nhận',
      2: 'Đang chuẩn bị',
      3: 'Đang giao',
      4: 'Đã giao',
      5: 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
  }

  getPaymentClass(status: PaymentStatus | string): string {
    if (typeof status === 'string') {
      const stringMap: { [key: string]: string } = {
        'Pending': 'pending',
        'Paid': 'paid',
        'Failed': 'failed',
        'Refunded': 'refunded'
      };
      return stringMap[status] || 'pending';
    }
    const statusMap: { [key: number]: string } = {
      0: 'pending',
      1: 'paid',
      2: 'failed',
      3: 'refunded'
    };
    return statusMap[status] || 'pending';
  }

  getPaymentStatusName(status: PaymentStatus | string): string {
    if (typeof status === 'string') {
      const stringMap: { [key: string]: string } = {
        'Pending': 'Chưa thanh toán',
        'Paid': 'Đã thanh toán',
        'Failed': 'Thanh toán thất bại',
        'Refunded': 'Đã hoàn tiền'
      };
      return stringMap[status] || status;
    }
    const statusMap: { [key: number]: string } = {
      0: 'Chưa thanh toán',
      1: 'Đã thanh toán',
      2: 'Thanh toán thất bại',
      3: 'Đã hoàn tiền'
    };
    return statusMap[status] || 'Không xác định';
  }

  getPaymentMethodName(method: string | undefined): string {
    if (!method) return '💵 Thanh toán khi nhận hàng'; // Default COD for old orders
    const methodMap: { [key: string]: string } = {
      'COD': '💵 Thanh toán khi nhận hàng',
      'BankTransfer': '🏦 Chuyển khoản ngân hàng'
    };
    return methodMap[method] || method;
  }

  cancelOrder(orderId: number, event: Event): void {
    event.stopPropagation();
    const reason = prompt('Lý do hủy đơn:');
    if (reason) {
      this.orderService.cancelOrder(orderId, reason).subscribe({
        next: () => this.loadOrders(),
        error: () => alert('Không thể hủy đơn hàng. Vui lòng thử lại.')
      });
    }
  }
}
