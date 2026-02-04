import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MealPlan, MealPlanRequest, AIMealPlanResponse, ChatMessage, ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MealPlanService {
  private apiUrl = `${environment.apiUrl}/mealplans`;

  constructor(private http: HttpClient) { }

  generateMealPlan(request: MealPlanRequest): Observable<AIMealPlanResponse> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate`, {
      message: request.userRequest
    }).pipe(
      map(response => {
        if (!response || !response.success || !response.data) {
          throw new Error(response?.message || 'Invalid response from server');
        }

        // Transform API response to AIMealPlanResponse
        const mealPlan = response.data;
        let totalPrice = mealPlan.totalCost || 0;
        const unmatchedIngredients: string[] = [];

        // Find unmatched ingredients
        if (mealPlan.meals) {
          mealPlan.meals.forEach((meal: any) => {
            if (meal.ingredients) {
              meal.ingredients.forEach((ing: any) => {
                if (!ing.isMatched) {
                  unmatchedIngredients.push(ing.ingredientName);
                }
              });
            }
          });
        }

        const result = {
          mealPlan,
          totalPrice,
          unmatchedIngredients,
          suggestedProducts: []
        } as AIMealPlanResponse;

        return result;
      })
    );
  }

  getMealPlans(): Observable<MealPlan[]> {
    return this.http.get<ApiResponse<MealPlan[]>>(this.apiUrl).pipe(
      map(response => response.data || [])
    );
  }

  getMealPlan(id: number): Observable<MealPlan> {
    return this.http.get<ApiResponse<MealPlan>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data!)
    );
  }

  deleteMealPlan(id: number): Observable<void> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }

  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ApiResponse<ChatMessage[]>>(`${this.apiUrl}/chat-history`).pipe(
      map(response => response.data || [])
    );
  }

  regenerateMeal(mealPlanId: number, mealId: number): Observable<MealPlan> {
    return this.http.post<ApiResponse<MealPlan>>(`${this.apiUrl}/${mealPlanId}/meals/${mealId}/regenerate`, {}).pipe(
      map(response => response.data!)
    );
  }

  /**
   * Sales Chatbot với Function Calling
   */
  salesChat(request: SalesChatRequest): Observable<SalesChatResponse> {
    return this.http.post<SalesChatResponse>(`${this.apiUrl}/sales-chat`, request);
  }

  /**
   * Lấy gợi ý nguyên liệu thay thế (từ AI)
   */
  getSwapSuggestions(request: IngredientSwapRequest): Observable<IngredientSwapResponse> {
    return this.http.post<IngredientSwapResponse>(`${this.apiUrl}/swap-suggestions`, request);
  }

  /**
   * Lấy tất cả nguyên liệu có sẵn từ database (không cần AI)
   */
  getAvailableProducts(): Observable<ProductForSwap[]> {
    return this.http.get<ApiResponse<ProductForSwap[]>>(`${environment.apiUrl}/products?availableOnly=true`).pipe(
      map(response => response.data || [])
    );
  }
}

// Product for swap (simple)
export interface ProductForSwap {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
}

// Ingredient Swap interfaces
export interface IngredientSwapRequest {
  dishName: string;
  currentIngredient: string;
  currentUnit: string;
  currentQuantity: number;
}

export interface IngredientSwapResponse {
  success: boolean;
  message: string;
  suggestions: SwapSuggestion[];
}

export interface SwapSuggestion {
  ingredientName: string;
  suggestedQuantity: number;
  unit: string;
  reason: string;
  productId?: number;
  price?: number;
  isAvailable: boolean;
}

// Sales Chatbot interfaces
export interface SalesChatRequest {
  message: string;
  conversationHistory?: SalesChatMessage[];
}

export interface SalesChatMessage {
  role: string;
  content: string;
}

export interface SalesChatResponse {
  success: boolean;
  message: string;
  suggestedRecipe?: string;
  recommendedProducts: RecommendedProduct[];
  totalPrice: number;
  outOfStockItems?: string[];
}

export interface RecommendedProduct {
  productId: number;
  name: string;
  price: number;
  unit?: string;
  quantityInStock: number;
  suggestedQuantity: number;
  suggestedUnit?: string;
  subTotal: number;
  imageUrl?: string;
}

