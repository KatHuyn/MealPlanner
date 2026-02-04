import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Product } from '../models/models';
import { calculateIngredientPrice } from '../utils/unit-converter';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {
    const saved = localStorage.getItem('cart');
    if (saved) {
      this.cartItems.next(JSON.parse(saved));
    }
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }

  // Thêm sản phẩm vào giỏ hàng
  // quantity: số lượng theo đơn vị nhập (gram cho kg, ml cho lít)
  addToCart(product: Product, quantity: number = 1): void {
    const items = [...this.cartItems.value];
    const existingIndex = items.findIndex(item => item.product.id === product.id);

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({ product, quantity });
    }

    this.cartItems.next(items);
    this.saveCart();
  }

  updateQuantity(productId: number, quantity: number): void {
    const items = this.cartItems.value.map(item => {
      if (item.product.id === productId) {
        // Enforce minimum quantity only for kg products
        const unit = (item.product.unit || 'kg').toLowerCase();
        let minQuantity = 1;

        // Chỉ sản phẩm kg mới có minimum 100g
        if (unit === 'kg' || unit === 'kilogram') {
          minQuantity = 100; // Tối thiểu 100g
        }
        // Sản phẩm lít bán nguyên chai (1 lít = 1 chai), không cần minimum

        // If quantity goes below minimum, remove item
        if (quantity < minQuantity) {
          return { ...item, quantity: 0 }; // Will be filtered out
        }

        return { ...item, quantity };
      }
      return item;
    }).filter(item => item.quantity > 0);

    this.cartItems.next(items);
    this.saveCart();
  }

  removeFromCart(productId: number): void {
    const items = this.cartItems.value.filter(item => item.product.id !== productId);
    this.cartItems.next(items);
    this.saveCart();
  }

  clearCart(): void {
    this.cartItems.next([]);
    localStorage.removeItem('cart');
  }

  // Tính tổng tiền giỏ hàng
  // Tự động quy đổi gram -> kg, ml -> lít khi tính giá
  getTotal(): number {
    return this.cartItems.value.reduce((total, item) => {
      // Sử dụng helper để tính giá
      // Giả định: quantity trong cart là đơn vị nhập (g cho kg, ml cho lít)
      const unit = (item.product.unit || '').toLowerCase();
      let inputUnit = 'g'; // Mặc định là gram
      if (unit === 'l' || unit === 'lít') inputUnit = 'ml';
      else if (unit !== 'kg') inputUnit = unit; // Giữ nguyên nếu không phải kg/lít

      return total + calculateIngredientPrice(
        item.product.price,
        item.product.unit,
        item.quantity,
        inputUnit
      );
    }, 0);
  }

  getItemCount(): number {
    return this.cartItems.value.length;
  }

  // Tính giá cho từng item trong giỏ hàng (có quy đổi đơn vị)
  getItemPrice(item: CartItem): number {
    const unit = (item.product.unit || '').toLowerCase();
    let inputUnit = 'g'; // Mặc định là gram
    if (unit === 'l' || unit === 'lít') inputUnit = 'ml';
    else if (unit !== 'kg') inputUnit = unit;

    return calculateIngredientPrice(
      item.product.price,
      item.product.unit,
      item.quantity,
      inputUnit
    );
  }

  get items(): CartItem[] {
    return this.cartItems.value;
  }

  addMealPlanIngredients(ingredients: { productId: number; quantity: number; product: Product }[]): void {
    ingredients.forEach(ing => {
      if (ing.product) {
        this.addToCart(ing.product, ing.quantity);
      }
    });
  }
}
