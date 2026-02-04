import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-dashboard">
      @if (!isAdmin()) {
        <div class="access-denied">
          <h2>⛔ Truy cập bị từ chối</h2>
          <p>Bạn không có quyền truy cập trang này.</p>
          <button (click)="goHome()">← Về trang chủ</button>
        </div>
      } @else {
        <div class="dashboard-header">
          <h1>🏪 Admin Dashboard</h1>
          <div class="stats">
            <div class="stat-card pending">
              <span class="stat-number">{{ pendingCount() }}</span>
              <span class="stat-label">Đơn chờ xử lý</span>
            </div>
            <div class="stat-card processing">
              <span class="stat-number">{{ processingCount() }}</span>
              <span class="stat-label">Đang xử lý</span>
            </div>
            <div class="stat-card shipping">
              <span class="stat-number">{{ shippingCount() }}</span>
              <span class="stat-label">Đang giao</span>
            </div>
            <div class="stat-card delivered">
              <span class="stat-number">{{ deliveredCount() }}</span>
              <span class="stat-label">Đã giao</span>
            </div>
          </div>
        </div>

        <div class="orders-section">
          <div class="section-header">
            <h2>📦 Quản lý đơn hàng</h2>
            <div class="filters">
              <select [(ngModel)]="statusFilter" (change)="loadOrders()">
                <option value="">Tất cả</option>
                <option value="Pending">Chờ xử lý</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Processing">Đang xử lý</option>
                <option value="Shipping">Đang giao</option>
                <option value="Delivered">Đã giao</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
              <button class="btn-refresh" (click)="loadOrders()">🔄 Làm mới</button>
            </div>
          </div>

          @if (loading()) {
            <div class="loading">
              <div class="spinner"></div>
              <p>Đang tải đơn hàng...</p>
            </div>
          } @else if (orders().length === 0) {
            <div class="empty-state">
              <p>Không có đơn hàng nào</p>
            </div>
          } @else {
            <div class="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Người nhận</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of orders(); track order.id) {
                    <tr>
                      <td class="order-code">{{ order.orderCode }}</td>
                      <td>{{ order.receiverName }}</td>
                      <td>
                        <div class="receiver-info">
                          <span>📞 {{ order.receiverPhone }}</span>
                          <span>📍 {{ order.shippingAddress }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="items-preview">
                          @for (item of order.orderItems?.slice(0, 2); track item.id) {
                            <span>{{ item.productName }} x{{ item.quantity }}</span>
                          }
                          @if ((order.orderItems?.length ?? 0) > 2) {
                            <span class="more">+{{ (order.orderItems?.length ?? 0) - 2 }} sản phẩm khác</span>
                          }
                        </div>
                      </td>
                      <td class="amount">{{ order.finalAmount | number }} đ</td>
                      <td>
                        <span class="status-badge" [class]="getStatusClass(order.status)">
                          {{ getStatusName(order.status) }}
                        </span>
                      </td>
                      <td>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td>
                        <div class="actions">
                          @if (order.status === 'Pending') {
                            <button class="btn-action confirm" (click)="updateStatus(order, 'Confirmed')">
                              ✅ Xác nhận
                            </button>
                          }
                          @if (order.status === 'Confirmed') {
                            <button class="btn-action process" (click)="updateStatus(order, 'Processing')">
                              🔨 Xử lý
                            </button>
                          }
                          @if (order.status === 'Processing') {
                            <button class="btn-action ship" (click)="updateStatus(order, 'Shipping')">
                              🚚 Giao hàng
                            </button>
                          }
                          @if (order.status === 'Shipping') {
                            <button class="btn-action deliver" (click)="updateStatus(order, 'Delivered')">
                              ✅ Đã giao
                            </button>
                          }
                          @if (order.status !== 'Cancelled' && order.status !== 'Delivered') {
                            <button class="btn-action cancel" (click)="cancelOrder(order)">
                              ❌ Hủy
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 70px);
      background: #f5f7fa;
    }

    .access-denied {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .access-denied button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .dashboard-header h1 {
      margin: 0 0 1.5rem;
      color: #333;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      text-align: center;
      border-left: 4px solid #667eea;
    }

    .stat-card.pending { border-left-color: #f39c12; }
    .stat-card.processing { border-left-color: #3498db; }
    .stat-card.shipping { border-left-color: #9b59b6; }
    .stat-card.delivered { border-left-color: #27ae60; }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .orders-section {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
    }

    .filters {
      display: flex;
      gap: 1rem;
    }

    .filters select {
      padding: 0.5rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .btn-refresh {
      padding: 0.5rem 1rem;
      background: #f5f5f5;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-refresh:hover {
      background: #e0e0e0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .orders-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    th {
      background: #f9f9f9;
      font-weight: 600;
      color: #333;
    }

    .order-code {
      font-family: monospace;
      font-weight: 600;
      color: #667eea;
    }

    .receiver-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
    }

    .items-preview {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
    }

    .items-preview .more {
      color: #888;
      font-style: italic;
    }

    .amount {
      font-weight: 600;
      color: #27ae60;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.pending { background: #fff3cd; color: #856404; }
    .status-badge.confirmed { background: #d1ecf1; color: #0c5460; }
    .status-badge.processing { background: #e2d6f7; color: #5a3d8a; }
    .status-badge.shipping { background: #d4edda; color: #155724; }
    .status-badge.delivered { background: #c3e6cb; color: #155724; }
    .status-badge.cancelled { background: #f8d7da; color: #721c24; }

    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-action {
      padding: 0.4rem 0.75rem;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .btn-action:hover {
      transform: scale(1.05);
    }

    .btn-action.confirm { background: #d1ecf1; color: #0c5460; }
    .btn-action.process { background: #e2d6f7; color: #5a3d8a; }
    .btn-action.ship { background: #d4edda; color: #155724; }
    .btn-action.deliver { background: #c3e6cb; color: #155724; }
    .btn-action.cancel { background: #f8d7da; color: #721c24; }

    @media (max-width: 1024px) {
      .filters {
        flex-direction: column;
      }

      table {
        font-size: 0.85rem;
      }

      th, td {
        padding: 0.75rem 0.5rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  loading = signal(true);
  statusFilter = '';

  isAdmin = signal(false);
  pendingCount = signal(0);
  processingCount = signal(0);
  shippingCount = signal(0);
  deliveredCount = signal(0);

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.isAdmin.set(user?.isAdmin ?? false);

    if (this.isAdmin()) {
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAllOrders(1, 50, this.statusFilter || undefined).subscribe({
      next: (response: unknown) => {
        const res = response as { success?: boolean; data?: Order[] };
        const orders = res.data ?? (response as Order[]);
        this.orders.set(orders);
        this.updateStats(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  updateStats(orders: Order[]): void {
    this.pendingCount.set(orders.filter(o => o.status === OrderStatus.Pending || o.status.toString() === 'Pending').length);
    this.processingCount.set(orders.filter(o => o.status === OrderStatus.Processing || o.status.toString() === 'Processing').length);
    this.shippingCount.set(orders.filter(o => o.status === OrderStatus.Shipped || o.status.toString() === 'Shipping').length);
    this.deliveredCount.set(orders.filter(o => o.status === OrderStatus.Delivered || o.status.toString() === 'Delivered').length);
  }

  getStatusName(status: OrderStatus | string): string {
    const statusStr = status.toString();
    switch (statusStr) {
      case 'Pending': return 'Chờ xử lý';
      case 'Confirmed': return 'Đã xác nhận';
      case 'Processing': return 'Đang xử lý';
      case 'Shipping': return 'Đang giao';
      case 'Delivered': return 'Đã giao';
      case 'Cancelled': return 'Đã hủy';
      default: return statusStr;
    }
  }

  getStatusClass(status: OrderStatus | string): string {
    return status.toString().toLowerCase();
  }

  updateStatus(order: Order, newStatus: string): void {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.message || 'Không thể cập nhật trạng thái');
      }
    });
  }

  cancelOrder(order: Order): void {
    const reason = prompt('Lý do hủy đơn:');
    if (reason) {
      this.orderService.cancelOrder(order.id, reason).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (err) => {
          alert(err.error?.message || 'Không thể hủy đơn');
        }
      });
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
