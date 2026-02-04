import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, CreateProductRequest } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/models';

@Component({
    selector: 'app-admin-products',
    imports: [CommonModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="admin-products">
      @if (!isAdmin()) {
        <div class="access-denied">
          <h2>⛔ Truy cập bị từ chối</h2>
          <p>Bạn không có quyền truy cập trang này.</p>
          <button (click)="goHome()">← Về trang chủ</button>
        </div>
      } @else {
        <div class="header">
          <h1>📦 Quản lý sản phẩm</h1>
          <button class="btn-add" (click)="openAddModal()">+ Thêm sản phẩm</button>
        </div>

        <div class="filters">
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterProducts()" placeholder="🔍 Tìm kiếm...">
          <select [(ngModel)]="selectedCategory" (ngModelChange)="filterProducts()">
            <option value="">Tất cả danh mục</option>
            @for (cat of categories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
        </div>

        <div class="products-table">
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Calories</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              @for (product of filteredProducts(); track product.id) {
                <tr>
                  <td class="img-cell">
                    <img [src]="product.imageUrl || 'https://placehold.co/60x60/f5f5f5/999?text=No+Image'" [alt]="product.name">
                  </td>
                  <td class="name-cell">{{ product.name }}</td>
                  <td>{{ product.category }}</td>
                  <td class="price-cell">{{ product.price | number }}đ/{{ product.unit }}</td>
                  <td>{{ product.quantityInStock }}</td>
                  <td>{{ product.calories }} kcal</td>
                  <td class="actions-cell">
                    <button class="btn-edit" (click)="openEditModal(product)">✏️</button>
                    <button class="btn-delete" (click)="confirmDelete(product)">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (showModal()) {
          <div class="modal-overlay" (click)="closeModal()">
            <div class="modal" (click)="$event.stopPropagation()">
              <h2>{{ isEditing() ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới' }}</h2>
              
              <div class="form-grid">
                <div class="form-group">
                  <label>Tên sản phẩm *</label>
                  <input type="text" [(ngModel)]="editForm.name" required>
                </div>
                
                <div class="form-group">
                  <label>Danh mục</label>
                  <input type="text" [(ngModel)]="editForm.category" list="categories-list">
                  <datalist id="categories-list">
                    @for (cat of categories(); track cat) {
                      <option [value]="cat"></option>
                    }
                  </datalist>
                </div>

                <div class="form-group">
                  <label>Giá *</label>
                  <input type="number" [(ngModel)]="editForm.price" required>
                </div>

                <div class="form-group">
                  <label>Đơn vị</label>
                  <input type="text" [(ngModel)]="editForm.unit" placeholder="kg, g, cái...">
                </div>

                <div class="form-group">
                  <label>Tồn kho</label>
                  <input type="number" [(ngModel)]="editForm.quantityInStock">
                </div>

                <div class="form-group">
                  <label>Calories</label>
                  <input type="number" [(ngModel)]="editForm.calories">
                </div>

                <div class="form-group">
                  <label>Protein (g)</label>
                  <input type="number" [(ngModel)]="editForm.protein">
                </div>

                <div class="form-group">
                  <label>Carbs (g)</label>
                  <input type="number" [(ngModel)]="editForm.carbs">
                </div>

                <div class="form-group">
                  <label>Fat (g)</label>
                  <input type="number" [(ngModel)]="editForm.fat">
                </div>

                <div class="form-group full-width">
                  <label>URL Hình ảnh</label>
                  <input type="url" [(ngModel)]="editForm.imageUrl" placeholder="https://...">
                </div>

                @if (editForm.imageUrl) {
                  <div class="form-group full-width image-preview">
                    <label>Xem trước</label>
                    <img [src]="editForm.imageUrl" alt="Preview" (error)="onImageError($event)">
                  </div>
                }

                <div class="form-group full-width">
                  <label>Mô tả</label>
                  <textarea [(ngModel)]="editForm.description" rows="2"></textarea>
                </div>

                <div class="form-group full-width">
                  <label>Từ khóa tìm kiếm</label>
                  <input type="text" [(ngModel)]="editForm.keywords" placeholder="keyword1, keyword2...">
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn-cancel" (click)="closeModal()">Hủy</button>
                <button class="btn-save" (click)="saveProduct()" [disabled]="saving()">
                  {{ saving() ? 'Đang lưu...' : 'Lưu' }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .admin-products { padding: 2rem; max-width: 1400px; margin: 0 auto; min-height: calc(100vh - 70px); background: #f5f7fa; }
    .access-denied { text-align: center; padding: 3rem; background: white; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    .access-denied button { margin-top: 1rem; padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header h1 { margin: 0; color: #333; }
    .btn-add { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
    .btn-add:hover { transform: translateY(-2px); }
    
    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .filters input, .filters select { padding: 0.75rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
    .filters input { flex: 1; }
    .filters input:focus, .filters select:focus { outline: none; border-color: #667eea; }
    
    .products-table { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-weight: 600; color: #333; }
    tr:hover { background: #f8f9ff; }
    
    .img-cell img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
    .name-cell { font-weight: 600; color: #333; }
    .price-cell { color: #27ae60; font-weight: 600; }
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-edit, .btn-delete { padding: 0.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; transition: transform 0.2s; }
    .btn-edit { background: #e3f2fd; }
    .btn-delete { background: #ffebee; }
    .btn-edit:hover, .btn-delete:hover { transform: scale(1.1); }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; padding: 2rem; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
    .modal h2 { margin: 0 0 1.5rem; color: #333; }
    
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-weight: 600; color: #555; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .form-group input, .form-group textarea, .form-group select { padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #667eea; }
    
    .image-preview img { width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 2px solid #e0e0e0; }
    
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; background: #f5f5f5; color: #666; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .filters { flex-direction: column; }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
    private productService = inject(ProductService);
    private authService = inject(AuthService);
    private router = inject(Router);

    products = signal<Product[]>([]);
    filteredProducts = signal<Product[]>([]);
    categories = signal<string[]>([]);
    showModal = signal(false);
    isEditing = signal(false);
    saving = signal(false);
    isAdmin = signal(false);

    searchQuery = '';
    selectedCategory = '';
    editingProductId: number | null = null;

    editForm: CreateProductRequest = this.getEmptyForm();

    ngOnInit(): void {
        const user = this.authService.currentUser;
        this.isAdmin.set(user?.isAdmin ?? false);

        if (this.isAdmin()) {
            this.loadProducts();
            this.loadCategories();
        }
    }

    getEmptyForm(): CreateProductRequest {
        return {
            name: '',
            description: '',
            price: 0,
            unit: 'kg',
            quantityInStock: 100,
            category: '',
            imageUrl: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            keywords: ''
        };
    }

    loadProducts(): void {
        this.productService.getProducts().subscribe({
            next: (products) => {
                this.products.set(products);
                this.filterProducts();
            }
        });
    }

    loadCategories(): void {
        this.productService.getCategories().subscribe({
            next: (cats) => this.categories.set(cats)
        });
    }

    filterProducts(): void {
        let filtered = this.products();

        if (this.selectedCategory) {
            filtered = filtered.filter(p => p.category === this.selectedCategory);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.keywords && p.keywords.toLowerCase().includes(query))
            );
        }

        this.filteredProducts.set(filtered);
    }

    openAddModal(): void {
        this.editForm = this.getEmptyForm();
        this.editingProductId = null;
        this.isEditing.set(false);
        this.showModal.set(true);
    }

    openEditModal(product: Product): void {
        this.editForm = {
            name: product.name,
            description: product.description || '',
            price: product.price,
            unit: product.unit || 'kg',
            quantityInStock: product.quantityInStock,
            category: product.category || '',
            imageUrl: product.imageUrl || '',
            calories: product.calories || 0,
            protein: product.protein || 0,
            carbs: product.carbs || 0,
            fat: product.fat || 0,
            keywords: product.keywords || ''
        };
        this.editingProductId = product.id;
        this.isEditing.set(true);
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
    }

    saveProduct(): void {
        if (!this.editForm.name || !this.editForm.price) {
            alert('Vui lòng nhập tên và giá sản phẩm');
            return;
        }

        this.saving.set(true);

        if (this.isEditing() && this.editingProductId) {
            this.productService.updateProduct(this.editingProductId, this.editForm).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.closeModal();
                    this.loadProducts();
                },
                error: (err) => {
                    this.saving.set(false);
                    alert('Lỗi: ' + (err.error?.message || 'Không thể cập nhật sản phẩm'));
                }
            });
        } else {
            this.productService.createProduct(this.editForm).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.closeModal();
                    this.loadProducts();
                },
                error: (err) => {
                    this.saving.set(false);
                    alert('Lỗi: ' + (err.error?.message || 'Không thể tạo sản phẩm'));
                }
            });
        }
    }

    confirmDelete(product: Product): void {
        if (confirm(`Bạn có chắc muốn xóa "${product.name}"?`)) {
            this.productService.deleteProduct(product.id).subscribe({
                next: () => this.loadProducts(),
                error: (err) => alert('Lỗi: ' + (err.error?.message || 'Không thể xóa sản phẩm'))
            });
        }
    }

    onImageError(event: Event): void {
        (event.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f5f5/999?text=Invalid+URL';
    }

    goHome(): void {
        this.router.navigate(['/']);
    }
}
