import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderStatus, DashboardStats } from '../../models/models';

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
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <div class="header-content">
            <h1>📊 Admin Dashboard</h1>
            <p class="header-subtitle">Tổng quan hoạt động kinh doanh</p>
          </div>
          <div class="header-actions">
            <button class="btn-refresh" (click)="refreshAll()">🔄 Làm mới</button>
            <a routerLink="/admin/products" class="btn-nav">📦 Quản lý sản phẩm</a>
          </div>
        </div>

        <!-- Revenue Filter -->
        <div class="revenue-filter">
          <div class="filter-group">
            <label>📅 Chọn ngày:</label>
            <input type="date" [(ngModel)]="selectedStatsDate" (change)="loadDashboardStats()">
          </div>
          <button class="btn-reset-filter" (click)="resetStatsFilter()">↩ Hôm nay</button>
        </div>

        <!-- Revenue Cards -->
        <div class="revenue-section">
          <div class="revenue-card gradient-green">
            <div class="revenue-icon">💰</div>
            <div class="revenue-info">
              <span class="revenue-label">Tổng doanh thu</span>
              <span class="revenue-value">{{ formatCurrency(stats()?.totalRevenue || 0) }}</span>
              <span class="revenue-sub">{{ stats()?.deliveredOrders || 0 }} đơn đã giao</span>
            </div>
          </div>
          <div class="revenue-card gradient-blue">
            <div class="revenue-icon">📅</div>
            <div class="revenue-info">
              <span class="revenue-label">Doanh thu {{ getDateLabel() }}</span>
              <span class="revenue-value">{{ formatCurrency(stats()?.todayRevenue || 0) }}</span>
              <span class="revenue-sub">{{ stats()?.todayOrders || 0 }} đơn</span>
            </div>
          </div>
          <div class="revenue-card gradient-purple">
            <div class="revenue-icon">📆</div>
            <div class="revenue-info">
              <span class="revenue-label">Doanh thu {{ getMonthLabel() }}</span>
              <span class="revenue-value">{{ formatCurrency(stats()?.monthRevenue || 0) }}</span>
              <span class="revenue-sub">{{ stats()?.monthOrders || 0 }} đơn</span>
            </div>
          </div>
        </div>

        <!-- Order Status Cards -->
        <div class="stats-section">
          <h2 class="section-title">📦 Trạng thái đơn hàng</h2>
          <div class="stats-grid">
            <div class="stat-card" (click)="filterByStatus('')">
              <div class="stat-icon total">📋</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.totalOrders || 0 }}</span>
                <span class="stat-label">Tổng đơn hàng</span>
              </div>
            </div>
            <div class="stat-card" (click)="filterByStatus('Pending')">
              <div class="stat-icon pending">⏳</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.pendingOrders || 0 }}</span>
                <span class="stat-label">Chờ xử lý</span>
              </div>
            </div>
            <div class="stat-card" (click)="filterByStatus('Confirmed')">
              <div class="stat-icon confirmed">✅</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.confirmedOrders || 0 }}</span>
                <span class="stat-label">Đã xác nhận</span>
              </div>
            </div>
            <div class="stat-card" (click)="filterByStatus('Processing')">
              <div class="stat-icon processing">🔨</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.processingOrders || 0 }}</span>
                <span class="stat-label">Đang xử lý</span>
              </div>
            </div>
            <div class="stat-card" (click)="filterByStatus('Shipping')">
              <div class="stat-icon shipping">🚚</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.shippingOrders || 0 }}</span>
                <span class="stat-label">Đang giao</span>
              </div>
            </div>
            <div class="stat-card" (click)="filterByStatus('Delivered')">
              <div class="stat-icon delivered">🎉</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.deliveredOrders || 0 }}</span>
                <span class="stat-label">Đã giao</span>
              </div>
            </div>
            <div class="stat-card" (click)="filterByStatus('Cancelled')">
              <div class="stat-icon cancelled">❌</div>
              <div class="stat-info">
                <span class="stat-number">{{ stats()?.cancelledOrders || 0 }}</span>
                <span class="stat-label">Đã hủy</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        @if (stats()?.topProducts?.length) {
          <div class="top-products-section">
            <h2 class="section-title">🏆 Top sản phẩm bán chạy</h2>
            <div class="top-products-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th>SL đã bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of stats()?.topProducts; track product.productId; let i = $index) {
                    <tr>
                      <td>
                        <span class="rank-badge" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
                      </td>
                      <td class="product-name">{{ product.productName }}</td>
                      <td>{{ product.totalQuantitySold | number:'1.0-0' }}</td>
                      <td class="amount">{{ formatCurrency(product.totalRevenue) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Orders Management -->
        <div class="orders-section">
          <div class="section-header">
            <h2 class="section-title">📋 Quản lý đơn hàng</h2>
            <div class="filters">
              <input type="date" [(ngModel)]="startDate" (change)="loadOrders()" title="Từ ngày">
              <input type="date" [(ngModel)]="endDate" (change)="loadOrders()" title="Đến ngày">
              <select [(ngModel)]="statusFilter" (change)="loadOrders()">
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Chờ xử lý</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Processing">Đang xử lý</option>
                <option value="Shipping">Đang giao</option>
                <option value="Delivered">Đã giao</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
              <button class="btn-refresh-sm" (click)="loadOrders()">🔄</button>
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
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 70px);
      background: #f5f7fa;
      color: #333;
    }

    /* Access Denied */
    .access-denied {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 16px;
      border: 1px solid #e0e0e0;
    }

    .access-denied h2 { color: #ff6b6b; }
    .access-denied p { color: #666; }

    .access-denied button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 1.8rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-subtitle {
      margin: 0.25rem 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-refresh, .btn-nav {
      padding: 0.6rem 1.2rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 10px;
      color: #555;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.25s ease;
      text-decoration: none;
    }

    .btn-refresh:hover, .btn-nav:hover {
      background: #f0f0f0;
      border-color: #ccc;
      transform: translateY(-1px);
    }

    /* Revenue Section */
    .revenue-filter {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
      padding: 1rem 1.25rem;
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #555;
      white-space: nowrap;
    }

    .filter-group input[type="date"],
    .filter-group input[type="month"] {
      padding: 0.45rem 0.75rem;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #333;
      background: #f9f9f9;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .filter-group input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
    }

    .btn-reset-filter {
      padding: 0.45rem 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-left: auto;
    }

    .btn-reset-filter:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    }

    .revenue-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .revenue-card {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .revenue-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.5);
      border-radius: 16px;
    }

    .revenue-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .gradient-green {
      background: linear-gradient(135deg, #0d6b3a, #0a4a28);
      border: 1px solid rgba(39, 174, 96, 0.3);
    }
    .gradient-blue {
      background: linear-gradient(135deg, #1a4a7a, #0d2d4a);
      border: 1px solid rgba(52, 152, 219, 0.3);
    }
    .gradient-purple {
      background: linear-gradient(135deg, #5a2d82, #3d1d5c);
      border: 1px solid rgba(155, 89, 182, 0.3);
    }

    .revenue-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .revenue-info {
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    .revenue-label {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
      font-weight: 500;
    }

    .revenue-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }

    .revenue-sub {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
      margin-top: 0.15rem;
    }

    /* Stats Section */
    .section-title {
      margin: 0 0 1.25rem;
      font-size: 1.15rem;
      color: #333;
    }

    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border: 1px solid #e8e8e8;
      padding: 1.2rem;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .stat-card:hover {
      background: #f8f9fa;
      border-color: #d0d0d0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .stat-icon {
      font-size: 1.6rem;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .stat-icon.total { background: rgba(102,126,234,0.15); }
    .stat-icon.pending { background: rgba(243,156,18,0.15); }
    .stat-icon.confirmed { background: rgba(46,204,113,0.15); }
    .stat-icon.processing { background: rgba(52,152,219,0.15); }
    .stat-icon.shipping { background: rgba(155,89,182,0.15); }
    .stat-icon.delivered { background: rgba(39,174,96,0.15); }
    .stat-icon.cancelled { background: rgba(231,76,60,0.15); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #333;
    }

    .stat-label {
      font-size: 0.78rem;
      color: #888;
    }

    /* Top Products */
    .top-products-section {
      margin-bottom: 2rem;
    }

    .top-products-table {
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 14px;
      overflow: hidden;
    }

    .top-products-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .top-products-table th {
      background: #f8f9fa;
      padding: 0.85rem 1.25rem;
      text-align: left;
      font-weight: 600;
      color: #666;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .top-products-table td {
      padding: 0.85rem 1.25rem;
      border-top: 1px solid #f0f0f0;
      font-size: 0.9rem;
    }

    .top-products-table tr:hover td {
      background: #f8f9fa;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.8rem;
      background: #f0f0f0;
      color: #888;
    }
    .rank-1 { background: linear-gradient(135deg, #f39c12, #e67e22); color: white; }
    .rank-2 { background: linear-gradient(135deg, #bdc3c7, #95a5a6); color: white; }
    .rank-3 { background: linear-gradient(135deg, #e67e22, #d35400); color: white; }

    .product-name {
      font-weight: 600;
      color: #333;
    }

    /* Orders Section */
    .orders-section {
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 16px;
      padding: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header .section-title {
      margin: 0;
    }

    .filters {
      display: flex;
      gap: 0.75rem;      flex-wrap: wrap;
    }

    .filters input[type="date"],
    .filters select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      background: white;
      color: #555;
      cursor: pointer;
    }

    .filters input[type="date"]:focus,
    .filters select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.1);    }

    .filters select {
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #333;
      cursor: pointer;
    }

    .filters select option {
      background: white;
      color: #333;
    }

    .btn-refresh-sm {
      padding: 0.5rem 0.75rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 1rem;
    }

    .btn-refresh-sm:hover {
      background: #f0f0f0;
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
      border: 4px solid #e8e8e8;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading p { color: #666; }

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

    .orders-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th, .orders-table td {
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }

    .orders-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .orders-table tbody tr:hover td {
      background: #f8f9fa;
    }

    .order-code {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #667eea;
    }

    .receiver-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.82rem;
      color: #666;
    }

    .items-preview {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.82rem;
    }

    .items-preview .more {
      color: #666;
      font-style: italic;
    }

    .amount {
      font-weight: 700;
      color: #27ae60;
    }

    .status-badge {
      display: inline-block;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .status-badge.pending { background: rgba(243,156,18,0.15); color: #f39c12; }
    .status-badge.confirmed { background: rgba(46,204,113,0.15); color: #2ecc71; }
    .status-badge.processing { background: rgba(52,152,219,0.15); color: #3498db; }
    .status-badge.shipping { background: rgba(155,89,182,0.15); color: #9b59b6; }
    .status-badge.delivered { background: rgba(39,174,96,0.15); color: #27ae60; }
    .status-badge.cancelled { background: rgba(231,76,60,0.15); color: #e74c3c; }

    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-action {
      padding: 0.4rem 0.75rem;
      border: none;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-action:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }

    .btn-action.confirm { background: rgba(46,204,113,0.15); color: #2ecc71; }
    .btn-action.process { background: rgba(52,152,219,0.15); color: #3498db; }
    .btn-action.ship { background: rgba(155,89,182,0.15); color: #9b59b6; }
    .btn-action.deliver { background: rgba(39,174,96,0.15); color: #27ae60; }
    .btn-action.cancel { background: rgba(231,76,60,0.15); color: #e74c3c; }

    /* Responsive */
    @media (max-width: 1024px) {
      .revenue-section {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .filters {
        flex-direction: column;
      }

      .orders-table table {
        font-size: 0.82rem;
      }

      .orders-table th, .orders-table td {
        padding: 0.65rem 0.5rem;
      }
    }

    @media (max-width: 640px) {
      .admin-dashboard {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .revenue-value {
        font-size: 1.3rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  statusFilter = '';
  startDate: string = '';
  endDate: string = '';
  selectedStatsDate: string = '';

  isAdmin = signal(false);

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.isAdmin.set(user?.isAdmin ?? false);

    if (this.isAdmin()) {
      const now = new Date();
      this.selectedStatsDate = this.formatDateForInput(now);
      this.loadDashboardStats();
      this.loadOrders();
    }
  }

  loadDashboardStats(): void {
    // Derive month from selected date
    const month = this.selectedStatsDate ? this.selectedStatsDate.substring(0, 7) : undefined;
    this.orderService.getDashboardStats(this.selectedStatsDate, month).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
      }
    });
  }

  loadOrders(): void {
    this.loading.set(true);

    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;

    if (this.startDate && this.startDate.trim()) {
      startDate = new Date(this.startDate + 'T00:00:00Z');
    }
    if (this.endDate && this.endDate.trim()) {
      endDate = new Date(this.endDate + 'T23:59:59Z');
    }

    this.orderService.getAllOrders(1, 50, this.statusFilter || undefined, startDate, endDate).subscribe({
      next: (response: unknown) => {
        const res = response as { success?: boolean; data?: Order[] };
        const orders = res.data ?? (response as Order[]);
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.loading.set(false);
      }
    });
  }

  refreshAll(): void {
    this.loadDashboardStats();
    this.loadOrders();
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.loadOrders();
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M đ';
    }
    return value.toLocaleString('vi-VN') + ' đ';
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
        this.refreshAll();
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
          this.refreshAll();
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

  resetStatsFilter(): void {
    const now = new Date();
    this.selectedStatsDate = this.formatDateForInput(now);
    this.loadDashboardStats();
  }

  getDateLabel(): string {
    if (!this.selectedStatsDate) return 'hôm nay';
    const today = this.formatDateForInput(new Date());
    if (this.selectedStatsDate === today) return 'hôm nay';
    const parts = this.selectedStatsDate.split('-');
    return `ngày ${parts[2]}/${parts[1]}`;
  }

  getMonthLabel(): string {
    if (!this.selectedStatsDate) return 'tháng này';
    const thisMonth = this.formatDateForInput(new Date()).substring(0, 7);
    const selectedMonth = this.selectedStatsDate.substring(0, 7);
    if (selectedMonth === thisMonth) return 'tháng này';
    const parts = selectedMonth.split('-');
    return `tháng ${parseInt(parts[1])}/${parts[0]}`;
  }

  private formatDateForInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
