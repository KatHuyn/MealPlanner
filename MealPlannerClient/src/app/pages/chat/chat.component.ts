import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MealPlanService } from '../../services/meal-plan.service';
import { AuthService } from '../../services/auth.service';
import { MealPlan, AIMealPlanResponse, MealType, MealPlanIngredient } from '../../models/models';

interface ChatMsg {
  role: 'user' | 'ai';
  content: string;
  mealPlan?: MealPlan;
  totalPrice?: number;
  unmatchedIngredients?: string[];
  timestamp: Date;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMsg[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="chat-container">
      <div class="chat-sidebar">
        <h3>💬 Lịch sử chat</h3>
        <div class="chat-history">
          @for (conv of conversations; track conv.id) {
            <div class="history-item" [class.active]="conv.id === currentConversationId" (click)="loadConversation(conv.id)">
              <span class="history-icon">{{ conv.id === currentConversationId ? '💬' : '📝' }}</span>
              <span class="history-title">{{ conv.title }}</span>
              <button class="btn-delete" (click)="deleteConversation(conv.id, $event)" title="Xóa">🗑️</button>
            </div>
          }
          @if (conversations.length === 0) {
            <div class="history-empty">Chưa có cuộc trò chuyện nào</div>
          }
        </div>
        <button class="btn-new-chat" (click)="startNewChat()">+ Chat mới</button>
      </div>

      <div class="chat-main">
        <div class="chat-header">
          <h2>🤖 AI Meal Planner</h2>
          <p>Hãy cho tôi biết tình trạng sức khỏe và mong muốn của bạn!</p>
        </div>

        <div class="chat-messages" #chatMessages>
          @if (messages.length === 0) {
            <div class="welcome-message">
              <div class="welcome-icon">🍽️</div>
              <h3>Chào mừng đến với MealPlanner AI!</h3>
              <p>Tôi sẽ giúp bạn lên thực đơn phù hợp với sức khỏe.</p>
              <div class="suggestions">
                <button (click)="sendSuggestion('Tôi muốn thực đơn giảm cân cho người bị tiểu đường')">🥗 Thực đơn giảm cân cho người tiểu đường</button>
                <button (click)="sendSuggestion('Tôi cần thực đơn tăng cơ giàu protein')">💪 Thực đơn tăng cơ giàu protein</button>
                <button (click)="sendSuggestion('Gợi ý thực đơn ít muối cho người cao huyết áp')">❤️ Thực đơn ít muối cho cao huyết áp</button>
                <button (click)="sendSuggestion('Thực đơn ăn chay đầy đủ dinh dưỡng')">🥬 Thực đơn chay đủ dinh dưỡng</button>
              </div>
            </div>
          }

          @for (msg of messages; track msg.timestamp) {
            <div class="message" [class.user]="msg.role === 'user'" [class.ai]="msg.role === 'ai'">
              <div class="message-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
              <div class="message-content">
                <div class="message-text">{{ msg.content }}</div>
                
                @if (msg.mealPlan) {
                  <div class="meal-plan-card">
                    <h4>📋 Thực đơn ngày {{ msg.mealPlan.planDate | date:'dd/MM/yyyy' }}</h4>
                    
                    <div class="meals-grid">
                      @for (meal of msg.mealPlan.meals; track meal.id) {
                        <div class="meal-item">
                          <div class="meal-header">
                            <span class="meal-type">{{ getMealTypeName(meal.mealType) }}</span>
                            @if (meal.totalCalories) {
                              <span class="meal-calories">{{ meal.totalCalories }} cal</span>
                            }
                          </div>
                          <h5>{{ meal.dishName }}</h5>
                          @if (meal.description) {
                            <p class="meal-description">{{ meal.description }}</p>
                          }
                          
                          <div class="ingredients-list">
                            <strong>Nguyên liệu:</strong>
                            <ul>
                              @for (ing of meal.ingredients; track ing.id) {
                                <li [class.unmatched]="!ing.isMatched">
                                  {{ ing.ingredientName }} - {{ ing.quantity }} {{ ing.unit }}
                                  @if (ing.product) {
                                    <span class="price">({{ calculateIngredientPrice(ing) | number:'1.0-0' }} đ)</span>
                                  }
                                  @if (!ing.isMatched) {
                                    <span class="unmatched-badge">Chưa có</span>
                                  }
                                </li>
                              }
                            </ul>
                          </div>
                        </div>
                      }
                    </div>

                    <div class="plan-summary">
                      <div class="total-price">
                        <strong>Tổng tiền nguyên liệu:</strong>
                        <span class="price-value">{{ msg.totalPrice | number:'1.0-0' }} đ</span>
                      </div>
                      
                      @if (msg.unmatchedIngredients && msg.unmatchedIngredients.length > 0) {
                        <div class="unmatched-warning">
                          ⚠️ Có {{ msg.unmatchedIngredients.length }} nguyên liệu chưa có trong kho: 
                          {{ msg.unmatchedIngredients.join(', ') }}
                        </div>
                      }
                    </div>

                    <div class="plan-actions">
                      <button class="btn-view" [routerLink]="['/meal-plans', msg.mealPlan.id]">👁️ Xem chi tiết</button>
                      <button class="btn-order" (click)="orderMealPlan(msg.mealPlan)">🛒 Đặt nguyên liệu</button>
                    </div>
                  </div>
                }

                <div class="message-time">{{ msg.timestamp | date:'HH:mm' }}</div>
              </div>
            </div>
          }

          @if (isLoading) {
            <div class="message ai typing">
              <div class="message-avatar">🤖</div>
              <div class="message-content">
                <div class="typing-indicator"><span></span><span></span><span></span></div>
              </div>
            </div>
          }
        </div>

        <div class="chat-input">
          <input type="text" [(ngModel)]="userInput" (keyup.enter)="sendMessage()" placeholder="Nhập tin nhắn của bạn..." [disabled]="isLoading">
          <button (click)="sendMessage()" [disabled]="isLoading || !userInput.trim()">{{ isLoading ? '⏳' : '📤' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; height: calc(100vh - 70px); background: #f5f7fa; }

    .chat-sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #eee;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
    }

    .chat-sidebar h3 { margin-bottom: 1rem; color: #333; }
    .chat-history { flex: 1; overflow-y: auto; }

    .history-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 0.5rem;
      transition: background 0.2s;
    }

    .history-item:hover, .history-item.active { background: #f0f0f0; }
    
    .history-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }
    
    .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s, transform 0.2s;
      font-size: 0.8rem;
      padding: 0.25rem;
    }
    
    .history-item:hover .btn-delete { opacity: 1; }
    .btn-delete:hover { transform: scale(1.2); color: #e74c3c; }
    
    .history-empty {
      text-align: center;
      color: #999;
      padding: 1rem;
      font-size: 0.85rem;
    }

    .btn-new-chat {
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .chat-main { flex: 1; display: flex; flex-direction: column; }

    .chat-header {
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #eee;
    }

    .chat-header h2 { margin: 0; color: #333; }
    .chat-header p { margin: 0.5rem 0 0; color: #666; }

    .chat-messages { flex: 1; overflow-y: auto; padding: 2rem; }

    .welcome-message { text-align: center; padding: 3rem; }
    .welcome-icon { font-size: 4rem; margin-bottom: 1rem; }
    .welcome-message h3 { color: #333; margin-bottom: 0.5rem; }
    .welcome-message p { color: #666; margin-bottom: 2rem; }

    .suggestions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }

    .suggestions button {
      padding: 0.75rem 1.25rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .suggestions button:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .message {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      max-width: 80%;
    }

    .message.user {
      flex-direction: row-reverse;
      margin-left: auto;
    }

    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .message.user .message-avatar { background: #667eea; }

    .message-content {
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message-text { line-height: 1.5; }

    .message-time {
      font-size: 0.75rem;
      color: #999;
      margin-top: 0.5rem;
    }

    .message.user .message-time { color: rgba(255,255,255,0.7); }

    .meal-plan-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.25rem;
      margin-top: 1rem;
    }

    .meal-plan-card h4 {
      margin: 0 0 1rem;
      color: #333;
      font-size: 1.1rem;
    }

    .meals-grid { display: grid; gap: 1rem; }

    .meal-item {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .meal-type {
      font-size: 0.85rem;
      color: #667eea;
      font-weight: 600;
    }

    .meal-calories {
      font-size: 0.75rem;
      background: #fff3e0;
      color: #f57c00;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .meal-item h5 {
      margin: 0 0 0.5rem;
      color: #333;
      font-size: 1rem;
    }

    .meal-description {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.75rem;
    }

    .ingredients-list {
      font-size: 0.85rem;
      color: #555;
    }

    .ingredients-list ul {
      margin: 0.5rem 0 0;
      padding-left: 1.25rem;
    }

    .ingredients-list li {
      margin-bottom: 0.25rem;
    }

    .ingredients-list li.unmatched { color: #999; }

    .price { color: #4caf50; font-weight: 500; }

    .unmatched-badge {
      font-size: 0.7rem;
      background: #ffebee;
      color: #c62828;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.5rem;
    }

    .plan-summary {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .total-price {
      display: flex;
      justify-content: space-between;
      font-size: 1rem;
    }

    .price-value {
      color: #4caf50;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .unmatched-warning {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #f57c00;
      background: #fff3e0;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
    }

    .plan-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .plan-actions button {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s;
    }

    .plan-actions button:hover { transform: scale(1.02); }

    .btn-view {
      background: #e3f2fd;
      color: #1976d2;
    }

    .btn-order {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-8px); }
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
      padding: 1rem 1.25rem;
      border: 1px solid #ddd;
      border-radius: 25px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .chat-input input:focus { border-color: #667eea; }

    .chat-input button {
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1.25rem;
      transition: transform 0.2s;
    }

    .chat-input button:hover:not(:disabled) { transform: scale(1.05); }
    .chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 768px) {
      .chat-sidebar { display: none; }
      .message { max-width: 90%; }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessages') chatMessagesEl!: ElementRef;

  messages: ChatMsg[] = [];
  userInput = '';
  isLoading = false;

  // Chat history
  conversations: ChatConversation[] = [];
  currentConversationId: string = '';

  // Dynamic storage key based on userId
  private get STORAGE_KEY(): string {
    const userId = this.authService.currentUser?.id || 'guest';
    return `mealplanner_chat_history_${userId}`;
  }

  constructor(
    private mealPlanService: MealPlanService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.loadConversations();
    // Tạo conversation mới nếu chưa có
    if (this.conversations.length === 0) {
      this.createNewConversation();
    } else {
      // Load conversation gần nhất (không gọi detectChanges)
      const conv = this.conversations[0];
      this.currentConversationId = conv.id;
      this.messages = [...conv.messages];
    }
  }


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
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage = this.userInput;
    this.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });

    this.userInput = '';
    this.isLoading = true;

    this.mealPlanService.generateMealPlan({ userRequest: userMessage }).subscribe({
      next: (response: AIMealPlanResponse) => {
        this.ngZone.run(() => {
          this.messages.push({
            role: 'ai',
            content: `Tôi đã tạo thực đơn phù hợp cho bạn! Dựa trên yêu cầu "${userMessage}", đây là gợi ý của tôi:`,
            mealPlan: response.mealPlan,
            totalPrice: response.totalPrice,
            unmatchedIngredients: response.unmatchedIngredients,
            timestamp: new Date()
          });
          this.isLoading = false;
          this.saveCurrentConversation(); // Auto-save after AI response
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('API Error:', err);
          this.messages.push({
            role: 'ai',
            content: `Xin lỗi, tôi gặp sự cố khi tạo thực đơn: ${err.error?.message || 'Vui lòng thử lại.'}`,
            timestamp: new Date()
          });
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getMealTypeName(type: MealType | string): string {
    // Handle both enum values and string values
    const typeNum = typeof type === 'string' ? parseInt(type) || type : type;
    switch (typeNum) {
      case MealType.Breakfast:
      case 'Breakfast':
        return '🌅 Bữa sáng';
      case MealType.Lunch:
      case 'Lunch':
        return '☀️ Bữa trưa';
      case MealType.Dinner:
      case 'Dinner':
        return '🌙 Bữa tối';
      case MealType.Snack:
      case 'Snack':
        return '🍪 Bữa phụ';
      default:
        return '🍽️ Bữa ăn';
    }
  }

  orderMealPlan(mealPlan: MealPlan): void {
    this.router.navigate(['/checkout'], { queryParams: { mealPlanId: mealPlan.id } });
  }

  startNewChat(): void {
    // Lưu conversation hiện tại nếu có tin nhắn
    this.saveCurrentConversation();
    // Tạo conversation mới
    this.createNewConversation();
  }

  // === Chat History Methods ===

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadConversations(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.conversations = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.conversations.forEach(conv => {
          conv.createdAt = new Date(conv.createdAt);
          conv.updatedAt = new Date(conv.updatedAt);
          conv.messages.forEach(msg => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
        // Sort by updatedAt descending
        this.conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
      this.conversations = [];
    }
  }

  private saveConversations(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conversations));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }

  private createNewConversation(): void {
    const newConv: ChatConversation = {
      id: this.generateId(),
      title: 'Cuộc trò chuyện mới',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.unshift(newConv);
    this.currentConversationId = newConv.id;
    this.messages = [];
    this.userInput = '';
    this.saveConversations();
  }

  loadConversation(conversationId: string): void {
    // Lưu conversation hiện tại trước
    this.saveCurrentConversation();

    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      this.currentConversationId = conv.id;
      this.messages = [...conv.messages];
      this.cdr.detectChanges();
    }
  }

  private saveCurrentConversation(): void {
    if (!this.currentConversationId) return;

    const conv = this.conversations.find(c => c.id === this.currentConversationId);
    if (conv) {
      conv.messages = [...this.messages];
      conv.updatedAt = new Date();

      // Cập nhật title dựa trên tin nhắn đầu tiên của user
      const firstUserMsg = this.messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        conv.title = firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '');
      }

      this.saveConversations();
    }
  }

  deleteConversation(conversationId: string, event: Event): void {
    event.stopPropagation();

    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    this.saveConversations();

    // Nếu xóa conversation đang xem
    if (conversationId === this.currentConversationId) {
      if (this.conversations.length > 0) {
        this.loadConversation(this.conversations[0].id);
      } else {
        this.createNewConversation();
      }
    }
  }

  calculateIngredientPrice(ingredient: MealPlanIngredient): number {
    if (!ingredient.product) return 0;

    const quantity = ingredient.quantity;
    const ingredientUnit = (ingredient.unit || '').toLowerCase().trim();
    const productUnit = (ingredient.product.unit || 'kg').toLowerCase().trim();

    // ========== CHỈ KG MỚI CÓ THỂ BÁN LẺ THEO GRAM ==========
    // Ví dụ: 200g ức gà với giá 85,000đ/kg = 17,000đ
    if ((ingredientUnit === 'g' || ingredientUnit === 'gram' || ingredientUnit === 'gam')
      && (productUnit === 'kg' || productUnit === 'kilogram' || productUnit === 'kí' || productUnit === 'ký')) {
      const adjustedQuantity = quantity / 1000;
      return ingredient.product.price * adjustedQuantity;
    }

    // Trái cây bán theo kg nhưng AI gợi ý theo "quả"
    // Ví dụ: 1 quả chanh ≈ 50g → giá = 30,000 × 0.05 = 1,500đ
    if ((ingredientUnit === 'quả' || ingredientUnit === 'qua')
      && (productUnit === 'kg' || productUnit === 'kilogram' || productUnit === 'kí' || productUnit === 'ký')) {
      const gramsPerFruit = 50; // Ước tính 1 quả trái cây nhỏ ≈ 50g
      const adjustedQuantity = (quantity * gramsPerFruit) / 1000;
      return ingredient.product.price * adjustedQuantity;
    }

    // ========== CÁC SẢN PHẨM KHÔNG THỂ BÁN LẺ ==========
    // Dầu ăn, nước mắm: mua nguyên chai/lít
    // Ví dụ: 30ml nước mắm → cần 1 chai (60,000đ)
    if ((ingredientUnit === 'ml' || ingredientUnit === 'milliliter')
      && (productUnit === 'l' || productUnit === 'lít' || productUnit === 'lit' || productUnit === 'liter')) {
      const unitsNeeded = Math.ceil(quantity / 1000);
      return ingredient.product.price * unitsNeeded;
    }

    // Trứng: mua nguyên vỉ/chục (10 quả)
    // Ví dụ: 2 quả trứng → cần 1 vỉ (35,000đ)
    if ((ingredientUnit === 'quả' || ingredientUnit === 'qua')
      && (productUnit === 'chục' || productUnit === 'chuc' || productUnit === 'vỉ' || productUnit === 'vi')) {
      const unitsNeeded = Math.ceil(quantity / 10);
      return ingredient.product.price * unitsNeeded;
    }

    // Sữa đặc, phô mai: mua nguyên hộp
    if ((ingredientUnit === 'hộp' || ingredientUnit === 'hop')
      && (productUnit === 'hộp' || productUnit === 'hop')) {
      return ingredient.product.price * Math.ceil(quantity);
    }

    // Trường hợp mặc định
    return ingredient.product.price * quantity;
  }
}
