import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>🥗 Meal Planner AI</h1>
          <p class="tagline">Lên kế hoạch bữa ăn thông minh với trí tuệ nhân tạo</p>
          <p class="description">
            Nhập thông tin sức khỏe, sở thích ẩm thực của bạn - 
            AI sẽ tạo thực đơn phù hợp với nguyên liệu có sẵn!
          </p>
          
          @if (!isLoggedIn) {
            <div class="hero-actions">
              <a routerLink="/register" class="btn-primary">Bắt đầu ngay</a>
              <a routerLink="/login" class="btn-secondary">Đăng nhập</a>
            </div>
          } @else {
            <div class="hero-actions">
              <a routerLink="/chat" class="btn-primary">💬 Chat với AI</a>
              <a routerLink="/products" class="btn-secondary">🛒 Xem sản phẩm</a>
            </div>
          }
        </div>
        <div class="hero-image">
          <div class="floating-card card1">🥦</div>
          <div class="floating-card card2">🍗</div>
          <div class="floating-card card3">🥕</div>
          <div class="floating-card card4">🍳</div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <h2>✨ Tính năng nổi bật</h2>
        <div class="features-grid">
          <div class="feature-card">
            <span class="feature-icon">🧠</span>
            <h3>AI Thông minh</h3>
            <p>Sử dụng GPT để phân tích sức khỏe và đề xuất thực đơn phù hợp với bạn</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">📊</span>
            <h3>Phân tích sức khỏe</h3>
            <p>Nhập tình trạng sức khỏe, dị ứng, chế độ ăn để AI hiểu bạn hơn</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🍽️</span>
            <h3>3 bữa mỗi ngày</h3>
            <p>Thực đơn đầy đủ sáng - trưa - tối với công thức chi tiết</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🛒</span>
            <h3>Mua nguyên liệu</h3>
            <p>Tự động map nguyên liệu với sản phẩm có sẵn, đặt hàng nhanh chóng</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">💰</span>
            <h3>Giá cả rõ ràng</h3>
            <p>Hiển thị giá từng nguyên liệu, tổng chi phí cho mỗi bữa ăn</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">📱</span>
            <h3>Theo dõi đơn hàng</h3>
            <p>Quản lý đơn hàng, theo dõi trạng thái giao hàng dễ dàng</p>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="how-it-works">
        <h2>🚀 Cách hoạt động</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Nhập thông tin</h3>
            <p>Điền hồ sơ sức khỏe, dị ứng, chế độ ăn và sở thích ẩm thực</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>Chat với AI</h3>
            <p>Nói chuyện với AI về mong muốn, yêu cầu đặc biệt cho bữa ăn</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>Nhận thực đơn</h3>
            <p>AI tạo 3 bữa ăn với công thức chi tiết, map với nguyên liệu có sẵn</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">4</div>
            <h3>Đặt hàng</h3>
            <p>Thêm nguyên liệu vào giỏ, thanh toán và nhận hàng tận nơi</p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta">
        <div class="cta-content">
          <h2>Sẵn sàng bắt đầu?</h2>
          <p>Hãy để AI giúp bạn lên kế hoạch bữa ăn lành mạnh mỗi ngày!</p>
          @if (!isLoggedIn) {
            <a routerLink="/register" class="btn-cta">Đăng ký miễn phí</a>
          } @else {
            <a routerLink="/chat" class="btn-cta">Bắt đầu trò chuyện</a>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <p>© 2025 Meal Planner AI. Made with ❤️</p>
      </footer>
    </div>
  `,
  styles: [`
    .home-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

    /* Hero Section */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      padding: 4rem 0;
      min-height: 60vh;
      align-items: center;
    }

    .hero-content h1 {
      font-size: 3rem;
      margin: 0 0 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline { font-size: 1.5rem; color: #333; margin: 0 0 1rem; }
    .description { color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; }

    .hero-actions { display: flex; gap: 1rem; }

    .btn-primary, .btn-secondary {
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-secondary:hover {
      background: #f5f7ff;
      transform: translateY(-2px);
    }

    .hero-image {
      position: relative;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .floating-card {
      position: absolute;
      font-size: 4rem;
      animation: float 3s ease-in-out infinite;
    }

    .card1 { top: 10%; left: 20%; animation-delay: 0s; }
    .card2 { top: 20%; right: 10%; animation-delay: 0.5s; }
    .card3 { bottom: 30%; left: 10%; animation-delay: 1s; }
    .card4 { bottom: 10%; right: 20%; animation-delay: 1.5s; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    /* Features Section */
    .features { padding: 4rem 0; text-align: center; }
    .features h2 { font-size: 2rem; color: #333; margin-bottom: 3rem; }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    }

    .feature-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .feature-card h3 { color: #333; margin: 0 0 0.75rem; }
    .feature-card p { color: #666; margin: 0; line-height: 1.5; }

    /* How it works */
    .how-it-works { padding: 4rem 0; background: #f9f9f9; margin: 0 -1.5rem; padding: 4rem 1.5rem; }
    .how-it-works h2 { text-align: center; font-size: 2rem; color: #333; margin-bottom: 3rem; }

    .steps { display: flex; justify-content: center; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }

    .step {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
      width: 200px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .step-number {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.5rem;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .step h3 { color: #333; margin: 0 0 0.5rem; }
    .step p { color: #666; margin: 0; font-size: 0.9rem; }

    .step-arrow {
      font-size: 2rem;
      color: #667eea;
      padding-top: 2rem;
    }

    /* CTA */
    .cta {
      padding: 4rem 0;
      text-align: center;
    }

    .cta-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 4rem 2rem;
      border-radius: 24px;
      color: white;
    }

    .cta h2 { font-size: 2rem; margin: 0 0 1rem; }
    .cta p { font-size: 1.1rem; margin: 0 0 2rem; opacity: 0.9; }

    .btn-cta {
      display: inline-block;
      padding: 1rem 2.5rem;
      background: white;
      color: #667eea;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 2rem;
      color: #888;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .hero { grid-template-columns: 1fr; text-align: center; }
      .hero-image { display: none; }
      .hero-actions { justify-content: center; }
    }

    @media (max-width: 768px) {
      .features-grid { grid-template-columns: 1fr; }
      .step-arrow { display: none; }
      .steps { flex-direction: column; align-items: center; }
      .step { width: 100%; max-width: 300px; }
      .hero-content h1 { font-size: 2rem; }
      .tagline { font-size: 1.25rem; }
    }
  `]
})
export class HomeComponent {
  constructor(private authService: AuthService) { }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
