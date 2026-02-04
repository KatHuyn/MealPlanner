import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, HealthProfile, HealthProfileRequest, ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private healthProfileSubject = new BehaviorSubject<HealthProfile | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  healthProfile$ = this.healthProfileSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    const storedProfile = localStorage.getItem('healthProfile');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
    if (storedProfile) {
      this.healthProfileSubject.next(JSON.parse(storedProfile));
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        // Backend returns ApiResponse<LoginResponse> with data property
        const authData = response.data;
        if (authData) {
          localStorage.setItem('token', authData.token);
          localStorage.setItem('currentUser', JSON.stringify(authData.user));
          this.currentUserSubject.next(authData.user);
          if (authData.healthProfile) {
            localStorage.setItem('healthProfile', JSON.stringify(authData.healthProfile));
            this.healthProfileSubject.next(authData.healthProfile);
          }
        }
      }),
      map(response => response.data!)
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        const authData = response.data;
        if (authData) {
          localStorage.setItem('token', authData.token);
          localStorage.setItem('currentUser', JSON.stringify(authData.user));
          this.currentUserSubject.next(authData.user);
        }
      }),
      map(response => response.data!)
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('healthProfile');
    this.currentUserSubject.next(null);
    this.healthProfileSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get healthProfile(): HealthProfile | null {
    return this.healthProfileSubject.value;
  }

  updateHealthProfile(request: HealthProfileRequest): Observable<HealthProfile> {
    return this.http.put<ApiResponse<HealthProfile>>(`${this.apiUrl}/health-profile`, request).pipe(
      tap(response => {
        if (response.data) {
          localStorage.setItem('healthProfile', JSON.stringify(response.data));
          this.healthProfileSubject.next(response.data);
        }
      }),
      map(response => response.data!)
    );
  }

  getHealthProfile(): Observable<HealthProfile> {
    return this.http.get<ApiResponse<HealthProfile>>(`${this.apiUrl}/health-profile`).pipe(
      tap(response => {
        if (response.data) {
          localStorage.setItem('healthProfile', JSON.stringify(response.data));
          this.healthProfileSubject.next(response.data);
        }
      }),
      map(response => response.data!)
    );
  }
}
