import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HealthProfileRequest } from '../../models/models';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-card">
        <h1>👤 Hồ sơ sức khỏe</h1>
        <p class="subtitle">Cập nhật thông tin để nhận gợi ý thực đơn phù hợp</p>

        <form (ngSubmit)="save()" #profileForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="weight">Cân nặng (kg)</label>
              <input type="number" id="weight" [(ngModel)]="profile.weight" name="weight" step="0.1" placeholder="60">
            </div>
            <div class="form-group">
              <label for="height">Chiều cao (cm)</label>
              <input type="number" id="height" [(ngModel)]="profile.height" name="height" step="0.1" placeholder="165">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="age">Tuổi</label>
              <input type="number" id="age" [(ngModel)]="profile.age" name="age" placeholder="25">
            </div>
            <div class="form-group">
              <label for="gender">Giới tính</label>
              <select id="gender" [(ngModel)]="profile.gender" name="gender">
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="activityLevel">Mức độ vận động</label>
            <select id="activityLevel" [(ngModel)]="profile.activityLevel" name="activityLevel">
              <option value="">Chọn mức độ vận động</option>
              <option value="sedentary">Ít vận động (văn phòng)</option>
              <option value="light">Vận động nhẹ (1-2 ngày/tuần)</option>
              <option value="moderate">Vận động vừa (3-5 ngày/tuần)</option>
              <option value="active">Năng động (6-7 ngày/tuần)</option>
              <option value="very_active">Rất năng động (tập luyện nặng)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="allergies">Dị ứng thực phẩm</label>
            <input type="text" id="allergies" [(ngModel)]="profile.allergies" name="allergies" placeholder="VD: hải sản, đậu phộng, gluten...">
            <small>Liệt kê các loại thực phẩm bạn dị ứng, cách nhau bằng dấu phẩy</small>
          </div>

          <div class="form-group">
            <label for="healthConditions">Tình trạng sức khỏe</label>
            <input type="text" id="healthConditions" [(ngModel)]="profile.healthConditions" name="healthConditions" placeholder="VD: tiểu đường, cao huyết áp, gan nhiễm mỡ...">
            <small>Các bệnh lý cần lưu ý khi chọn thực phẩm</small>
          </div>

          <div class="form-group">
            <label for="dietaryPreferences">Sở thích ăn uống</label>
            <input type="text" id="dietaryPreferences" [(ngModel)]="profile.dietaryPreferences" name="dietaryPreferences" placeholder="VD: ăn chay, không thịt đỏ, ít muối...">
          </div>

          <div class="form-group">
            <label for="goals">Mục tiêu sức khỏe</label>
            <textarea id="goals" [(ngModel)]="profile.goals" name="goals" rows="3" placeholder="VD: Giảm cân, tăng cơ, ăn uống lành mạnh..."></textarea>
          </div>

          @if (success) {
            <div class="success">{{ success }}</div>
          }
          @if (error) {
            <div class="error">{{ error }}</div>
          }

          <button type="submit" [disabled]="loading" class="btn-submit">
            {{ loading ? 'Đang lưu...' : 'Lưu thông tin' }}
          </button>
        </form>

        @if (profile.weight && profile.height) {
          <div class="bmi-section">
            <h3>📊 Chỉ số BMI</h3>
            <div class="bmi-value" [class]="bmiClass">{{ bmi | number:'1.1-1' }}</div>
            <p class="bmi-status">{{ bmiStatus }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-container { min-height: 100vh; padding: 2rem; background: #f5f7fa; }

    .profile-card {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    h1 { color: #333; margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    input:focus, select:focus, textarea:focus { outline: none; border-color: #667eea; }
    small { display: block; margin-top: 0.25rem; color: #888; font-size: 0.8rem; }
    textarea { resize: vertical; }

    .success { background: #e6f7e6; color: #27ae60; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
    .error { background: #ffe6e6; color: #d63031; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }

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

    .bmi-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      text-align: center;
    }

    .bmi-section h3 { margin-bottom: 1rem; }
    .bmi-value { font-size: 3rem; font-weight: bold; margin-bottom: 0.5rem; }
    .bmi-value.underweight { color: #3498db; }
    .bmi-value.normal { color: #27ae60; }
    .bmi-value.overweight { color: #f39c12; }
    .bmi-value.obese { color: #e74c3c; }
    .bmi-status { color: #666; }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  profile: HealthProfileRequest = {};
  loading = false;
  success = '';
  error = '';

  ngOnInit(): void {
    const existing = this.authService.healthProfile;
    if (existing) {
      this.profile = { ...existing };
    } else {
      this.authService.getHealthProfile().subscribe({
        next: (profile) => {
          this.profile = { ...profile };
          this.cdr.markForCheck();
        },
        error: () => { }
      });
    }
  }

  get bmi(): number {
    if (!this.profile.weight || !this.profile.height) return 0;
    const heightM = this.profile.height / 100;
    return this.profile.weight / (heightM * heightM);
  }

  get bmiClass(): string {
    if (this.bmi < 18.5) return 'underweight';
    if (this.bmi < 25) return 'normal';
    if (this.bmi < 30) return 'overweight';
    return 'obese';
  }

  get bmiStatus(): string {
    if (this.bmi < 18.5) return 'Thiếu cân - Nên tăng cường dinh dưỡng';
    if (this.bmi < 25) return 'Bình thường - Duy trì chế độ ăn hiện tại';
    if (this.bmi < 30) return 'Thừa cân - Nên giảm calo và tăng vận động';
    return 'Béo phì - Cần điều chỉnh chế độ ăn nghiêm túc';
  }

  save(): void {
    this.loading = true;
    this.success = '';
    this.error = '';
    this.cdr.markForCheck();

    this.authService.updateHealthProfile(this.profile).subscribe({
      next: () => {
        this.success = 'Lưu thông tin thành công!';
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Lưu thất bại. Vui lòng thử lại.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
