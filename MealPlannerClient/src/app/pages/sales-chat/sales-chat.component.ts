import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, NgZone, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MealPlanService, SalesChatResponse, RecommendedProduct, SalesChatMessage } from '../../services/meal-plan.service';
import { CartService } from '../../services/cart.service';

interface ChatMsg {
    role: 'user' | 'ai';
    content: string;
    products?: RecommendedProduct[];
    totalPrice?: number;
    outOfStock?: string[];
    timestamp: Date;
}

@Component({
    selector: 'app-sales-chat',
    imports: [CommonModule, FormsModule, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="sales-chat-container">
      <div class="chat-header">
        <h2>🛒 Tư Vấn Mua Hàng AI</h2>
        <p>Hỏi tôi về nguyên liệu, công thức nấu ăn - Tôi sẽ kiểm tra kho và gợi ý cho bạn!</p>
      </div>

      <div class="chat-messages" #chatMessages>
        @if (messages().length === 0) {
          <div class="welcome-message">
            <div class="welcome-icon">🤖</div>
            <h3>Xin chào! Tôi là trợ lý bán hàng AI</h3>
            <p>Tôi có thể giúp bạn tìm nguyên liệu và gợi ý công thức nấu ăn.</p>
            <div class="suggestions">
              <button (click)="sendSuggestion('Nhà còn mỗi trứng, nấu gì ngon nhỉ?')">🥚 Nhà còn trứng, nấu gì?</button>
              <button (click)="sendSuggestion('Shop có những loại thịt gì?')">🥩 Xem các loại thịt</button>
              <button (click)="sendSuggestion('Gợi ý món ăn nhanh dưới 50k')">⏰ Món nhanh dưới 50k</button>
              <button (click)="sendSuggestion('Có rau củ tươi gì không?')">🥬 Xem rau củ tươi</button>
            </div>
          </div>
        }

        @for (msg of messages(); track msg.timestamp) {
          <div class="message" [class.user]="msg.role === 'user'" [class.ai]="msg.role === 'ai'">
            <div class="message-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="message-content">
              <div class="message-text" [innerHTML]="formatMessage(msg.content)"></div>
              
              @if (msg.products && msg.products.length > 0) {
                <div class="products-card">
                  <h4>🛒 Sản phẩm gợi ý:</h4>
                  <div class="products-grid">
                    @for (product of msg.products; track product.productId) {
                      <div class="product-item">
                        <div class="product-info">
                          <span class="product-name">{{ product.name }}</span>
                          <span class="product-price">{{ product.price | number:'1.0-0' }}đ/{{ product.unit }}</span>
                          <span class="product-stock">Còn {{ product.quantityInStock }} {{ product.unit }}</span>
                        </div>
                        <button class="btn-add-cart" (click)="addToCart(product)">🛒 Thêm</button>
                      </div>
                    }
                  </div>
                  @if (msg.totalPrice) {
                    <div class="total-price">
                      <strong>Tổng gợi ý:</strong>
                      <span class="price-value">{{ msg.totalPrice | number:'1.0-0' }}đ</span>
                    </div>
                  }
                </div>
              }

              @if (msg.outOfStock && msg.outOfStock.length > 0) {
                <div class="out-of-stock-warning">
                  ⚠️ Hết hàng: {{ msg.outOfStock.join(', ') }}
                </div>
              }

              <div class="message-time">{{ msg.timestamp | date:'HH:mm' }}</div>
            </div>
          </div>
        }

        @if (isLoading()) {
          <div class="message ai typing">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          </div>
        }
      </div>

      <div class="chat-input">
        <input 
          type="text" 
          [(ngModel)]="userInput" 
          (keyup.enter)="sendMessage()" 
          placeholder="Hỏi về nguyên liệu, món ăn..." 
          [disabled]="isLoading()">
        <button (click)="sendMessage()" [disabled]="isLoading() || !userInput.trim()">
          {{ isLoading() ? '⏳' : '📤' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    .sales-chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 70px);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .chat-header {
      padding: 1.5rem 2rem;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      color: white;
      text-align: center;
    }

    .chat-header h2 { margin: 0; font-size: 1.5rem; }
    .chat-header p { margin: 0.5rem 0 0; opacity: 0.9; }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      background: #f5f7fa;
    }

    .welcome-message {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .welcome-icon { font-size: 4rem; margin-bottom: 1rem; }
    .welcome-message h3 { color: #333; margin-bottom: 0.5rem; }
    .welcome-message p { color: #666; margin-bottom: 2rem; }

    .suggestions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }

    .suggestions button {
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 0.9rem;
    }

    .suggestions button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102,126,234,0.4);
    }

    .message {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      max-width: 85%;
    }

    .message.user {
      flex-direction: row-reverse;
      margin-left: auto;
    }

    .message-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .message.user .message-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .message-content {
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 20px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.08);
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message-text { line-height: 1.6; white-space: pre-wrap; }

    .message-time {
      font-size: 0.75rem;
      color: #999;
      margin-top: 0.5rem;
    }

    .message.user .message-time { color: rgba(255,255,255,0.7); }

    .products-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .products-card h4 { margin: 0 0 0.75rem; font-size: 0.95rem; }

    .products-grid { display: flex; flex-direction: column; gap: 0.5rem; }

    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid #eee;
    }

    .product-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .product-name { font-weight: 600; color: #333; }
    .product-price { color: #4caf50; font-weight: 500; }
    .product-stock { font-size: 0.8rem; color: #999; }

    .btn-add-cart {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: transform 0.2s;
    }

    .btn-add-cart:hover { transform: scale(1.05); }

    .total-price {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #eee;
    }

    .price-value { color: #4caf50; font-weight: 700; font-size: 1.1rem; }

    .out-of-stock-warning {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #f57c00;
      background: #fff3e0;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
    }

    .typing-indicator span {
      width: 10px;
      height: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }

    .chat-input {
      display: flex;
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: white;
      border-top: 1px solid #eee;
    }

    .chat-input input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: 2px solid #eee;
      border-radius: 30px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .chat-input input:focus { border-color: #667eea; }

    .chat-input button {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      font-size: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .chat-input button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(102,126,234,0.4);
    }

    .chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 768px) {
      .message { max-width: 95%; }
      .suggestions button { font-size: 0.8rem; padding: 0.6rem 1rem; }
    }
  `]
})
export class SalesChatComponent implements AfterViewChecked {
    @ViewChild('chatMessages') chatMessagesEl!: ElementRef;

    messages = signal<ChatMsg[]>([]);
    userInput = '';
    isLoading = signal(false);

    // Conversation history cho context
    private conversationHistory: SalesChatMessage[] = [];

    constructor(
        private mealPlanService: MealPlanService,
        private cartService: CartService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        if (this.chatMessagesEl) {
            this.chatMessagesEl.nativeElement.scrollTop = this.chatMessagesEl.nativeElement.scrollHeight;
        }
    }

    sendSuggestion(text: string): void {
        this.userInput = text;
        this.sendMessage();
    }

    sendMessage(): void {
        if (!this.userInput.trim() || this.isLoading()) return;

        const userMessage = this.userInput;

        // Add user message to UI
        this.messages.update(msgs => [...msgs, {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);

        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: userMessage });

        this.userInput = '';
        this.isLoading.set(true);

        this.mealPlanService.salesChat({
            message: userMessage,
            conversationHistory: this.conversationHistory.slice(-10) // Keep last 10 messages for context
        }).subscribe({
            next: (response: SalesChatResponse) => {
                this.ngZone.run(() => {
                    // Add AI response to UI
                    this.messages.update(msgs => [...msgs, {
                        role: 'ai',
                        content: response.message,
                        products: response.recommendedProducts,
                        totalPrice: response.totalPrice,
                        outOfStock: response.outOfStockItems,
                        timestamp: new Date()
                    }]);

                    // Add to conversation history
                    this.conversationHistory.push({ role: 'model', content: response.message });

                    this.isLoading.set(false);
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error('Sales Chat Error:', err);
                    this.messages.update(msgs => [...msgs, {
                        role: 'ai',
                        content: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại nhé! 😅',
                        timestamp: new Date()
                    }]);
                    this.isLoading.set(false);
                });
            }
        });
    }

    addToCart(product: RecommendedProduct): void {
        // Convert RecommendedProduct to Product format for CartService
        const productForCart = {
            id: product.productId,
            name: product.name,
            price: product.price,
            unit: product.unit || '',
            quantityInStock: product.quantityInStock,
            isAvailable: true,
            imageUrl: product.imageUrl
        } as any;

        this.cartService.addToCart(productForCart, product.suggestedQuantity || 1);

        // Show feedback
        alert(`Đã thêm ${product.name} vào giỏ hàng! 🛒`);
    }

    formatMessage(text: string): string {
        // Convert line breaks to <br> and basic formatting
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
}
