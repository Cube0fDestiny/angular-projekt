import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, IncomingFriendRequest, OutgoingFriendRequest, FriendListItem } from '../../shared/models/user.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:3000/users';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getFriendRequestsOutgoing(): Observable<OutgoingFriendRequest[]> {
    return this.http.get<OutgoingFriendRequest[]>(`${this.apiUrl}/friend-requests/outgoing`);
  }

  getFriendRequestsIncoming(): Observable<IncomingFriendRequest[]> {
    return this.http.get<IncomingFriendRequest[]>(`${this.apiUrl}/friend-requests/incoming`);
  }

  getAllFriends(): Observable<FriendListItem[]> {
    return this.http.get<FriendListItem[]>(`${this.apiUrl}/friends/list`);
  }

  removeFriend(userId: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/friends/${userId}`);
  }

  rejectFriendRequest(requestId: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/friend-requests/${requestId}`);
  }

  acceptFriendRequest(requestId: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/friend-requests/${requestId}/accept`, {});
  }

  sendFriendRequest(userId: string): Observable<any> {
    return this.http.post<{message: string}>(`${this.apiUrl}/${userId}/friend-request`,null);
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

  updateProfile(userId: string, data: {
    name?: string;
    surname?: string;
    email?: string;
    password?: string;
    bio?: string;
    is_company?: boolean;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}`, data);
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