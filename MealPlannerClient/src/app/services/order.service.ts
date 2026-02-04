import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order, CreateOrderRequest, ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, request).pipe(
      map(response => response.data!)
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/my-orders`).pipe(
      map(response => response.data || [])
    );
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data!)
    );
  }

  cancelOrder(id: number, reason: string): Observable<Order> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/cancel`, { reason }).pipe(
      map(() => ({} as Order))
    );
  }

  createOrderFromMealPlan(mealPlanId: number, shippingInfo: {
    shippingAddress: string;
    receiverPhone: string;
    receiverName: string;
    notes?: string;
    paymentMethod?: string;
  }): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/from-meal-plan/${mealPlanId}`, shippingInfo).pipe(
      map(response => response.data!)
    );
  }

  // Admin methods
  getAllOrders(page = 1, pageSize = 20, status?: string): Observable<Order[]> {
    let url = `${this.apiUrl}/admin/all?page=${page}&pageSize=${pageSize}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<ApiResponse<Order[]>>(url).pipe(
      map(response => response.data || [])
    );
  }

  updateOrderStatus(orderId: number, status: string, reason?: string): Observable<Order> {
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/status`, { status, reason }).pipe(
      map(response => response.data!)
    );
  }
}
