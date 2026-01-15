import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../../shared/models/user.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:3001/users';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // In UserService
  setSession(user: User, token: string): void {
    //console.log('Storing token in localStorage:', token);
    //console.log('Storing user in localStorage:', user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }


  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  initializeFromStorage(): void {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      return;
    }
    try {
      const user = JSON.parse(raw);
      this.currentUserSubject.next(user);
    } catch (err) {
      this.clearSession();
    }
  }
}