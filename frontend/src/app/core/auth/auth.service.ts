import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { User } from '../../shared/models/user.model';
import { UserService } from '../user/user.service';

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = '/api/users';

  /** Re-expose user stream for components */
  constructor(
    private http: HttpClient,
    private router: Router,
    private userService: UserService
  ) {}

  get user$(): Observable<User | null> {
    return this.userService.currentUser$;
  }

  /* ============================
     Registration
     ============================ */

  register(data: {
    name: string;
    surname: string;
    email: string;
    password: string;
    is_company: boolean;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data
    ).pipe(
      tap(({ user, token }) => {
        this.userService.setSession(user, token);
        this.router.navigate(['/home']);
      })
    );
  }

  /* ============================
     Login
     ============================ */

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      tap(({ user, token }) => {
        this.userService.setSession(user, token);
        this.router.navigate(['/home']);
      })
    );
  }

  /* ============================
     Logout
     ============================ */

  logout(): void {
    this.userService.clearSession();
    this.router.navigate(['/login']);
  }

  /* ============================
     State helpers
     ============================ */

  isLoggedIn$(): Observable<boolean> {
    return this.user$.pipe(map(user => !!user));
  }
}
