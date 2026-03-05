import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="logo">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">MealPlanner</span>
        </a>
      </div>

      <div class="navbar-menu">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          Trang chủ
        </a>
        <a routerLink="/products" routerLinkActive="active">Sản phẩm</a>
        @if (authService.isLoggedIn()) {
          <a routerLink="/chat" routerLinkActive="active">Chat AI</a>
          <a routerLink="/orders" routerLinkActive="active">Đơn hàng</a>
        }
      </div>

      <div class="navbar-actions">
        <a routerLink="/cart" class="cart-icon">
          @if (cartService.getItemCount() > 0) {
            <span class="cart-badge">{{ cartService.getItemCount() }}</span>
          }
          🛒
        </a>

        @if (authService.isLoggedIn()) {
          <div class="user-menu">
            <span class="user-name">{{ authService.currentUser?.fullName }}</span>
            <div class="dropdown">
              <a routerLink="/profile">Hồ sơ sức khỏe</a>
              @if (authService.currentUser?.isAdmin) {
                <a routerLink="/admin">📊 Dashboard</a>
              }
              <a (click)="logout()">Đăng xuất</a>
            </div>
          </div>
        } @else {
          <a routerLink="/login" class="btn-login">Đăng nhập</a>
          <a routerLink="/register" class="btn-register">Đăng ký</a>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .navbar-brand .logo {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: white;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .logo-icon {
      font-size: 2rem;
      margin-right: 0.5rem;
    }

    .navbar-menu {
      display: flex;
      gap: 2rem;
    }

    .navbar-menu a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .navbar-menu a:hover, .navbar-menu a.active {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .cart-icon {
      position: relative;
      font-size: 1.5rem;
      text-decoration: none;
      cursor: pointer;
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ff4757;
      color: white;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 50%;
      font-weight: bold;
    }

    .user-menu {
      position: relative;
    }

    .user-name {
      color: white;
      cursor: pointer;
      padding: 0.5rem 1rem;
    }

    .dropdown {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 150px;
      overflow: hidden;
    }

    .user-menu:hover .dropdown {
      display: block;
    }

    .dropdown a {
      display: block;
      padding: 0.75rem 1rem;
      color: #333;
      text-decoration: none;
      cursor: pointer;
    }

    .dropdown a:hover {
      background: #f0f0f0;
    }

    .btn-login, .btn-register {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .btn-login {
      background: transparent;
      border: 2px solid rgba(255,255,255,0.5);
    }

    .btn-login:hover {
      border-color: white;
    }

    .btn-register {
      background: white;
      color: #667eea;
    }

    .btn-register:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255,255,255,0.3);
    }
  `]
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    public cartService: CartService
  ) { }

  logout(): void {
    this.authService.logout();
  }
}
