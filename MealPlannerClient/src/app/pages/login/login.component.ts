import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>🍽️ Đăng nhập</h1>
        <p class="subtitle">Chào mừng bạn trở lại!</p>

        <form (ngSubmit)="login()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" required email placeholder="your&#64;email.com">
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
          </div>

          @if (error) {
            <div class="error">{{ error }}</div>
          }

          <button type="submit" [disabled]="loading || !loginForm.valid" class="btn-submit">
            {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
          </button>
        </form>

        <p class="auth-link">
          Chưa có tài khoản? <a routerLink="/register">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .auth-card {
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }

    h1 { text-align: center; color: #333; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    input:focus { outline: none; border-color: #667eea; }

    .error {
      background: #ffe6e6;
      color: #d63031;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .btn-submit {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    .auth-link { text-align: center; margin-top: 1.5rem; color: #666; }
    .auth-link a { color: #667eea; text-decoration: none; font-weight: 600; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: (err) => {
        this.error = err.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }
}
