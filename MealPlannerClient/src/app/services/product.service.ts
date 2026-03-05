import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product, ApiResponse } from '../models/models';

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  unit?: string;
  quantityInStock: number;
  category?: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  keywords?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  getProducts(category?: string, search?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl, { params }).pipe(
      map(response => response.data || [])
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data!)
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/categories`).pipe(
      map(response => response.data || [])
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('query', query)
    }).pipe(
      map(response => response.data || [])
    );
  }

  // Admin CRUD methods
  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, request).pipe(
      map(response => response.data!)
    );
  }

  updateProduct(id: number, request: CreateProductRequest): Observable<Product> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => response.data!)
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.success)
    );
  }

  toggleProductVisibility(id: number): Observable<Product> {
    return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/${id}/toggle-visibility`, {}).pipe(
      map(response => response.data!)
    );
  }

  getAllProductsAdmin(): Observable<Product[]> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/admin/all`).pipe(
      map(response => response.data || [])
    );
  }
}

