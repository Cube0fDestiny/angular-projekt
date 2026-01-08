import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'  // Makes it globally available
})
export class UserService {
  // Private BehaviorSubject holds the current user
  //private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  // Public Observable - components subscribe to this
 // public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  
  // For one-time access (not recommended for reactive updates)
  //get currentUser(): User | null {
   // return this.currentUserSubject.value;
  //} 
  private users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'user',
      friends: [2, 3, 4],
      bio: 'Angular developer',
      status: 'online', 
      groups: [1, 2],
      password: 'password'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: 'user',
      friends: [1, 3, 5],
      bio: 'UI/UX Designer',
      status: 'online', 
      groups: [2, 3],
      password: 'password'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: 'admin',
      friends: [1, 2, 4],
      bio: 'Project Manager',
      status: 'away', 
      groups: [1, 3],
      password: 'password'
    },
    {
      id: 4,
      name: 'Alice Williams',
      email: 'alice@example.com',
      avatar: 'https://i.pravatar.cc/150?img=4',
      role: 'user',
      friends: [1, 3, 5],
      bio: 'Backend Developer',
      status: 'offline', 
      groups: [1],
      password: 'password'
    },
    {
      id: 5,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      avatar: 'https://i.pravatar.cc/150?img=5',
      role: 'user',
      friends: [2, 4],
      bio: 'DevOps Engineer',
      status: 'online', 
      groups: [2],
      password: 'password'
    }
  ];

  // Current user
  // private currentUserSubject = new BehaviorSubject<User | null>(this.users[0]);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  // Get all users
  getAllUsers(): User[] {
    return [...this.users]; // Return copy
  }
  
  // Get user by ID
  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  // Get current user
  get currentUser(): User | null{
    return this.currentUserSubject.value;
  }
  
  // Switch current user
  switchUser(userId: number): boolean {
    const user = this.getUserById(userId);
    if (user) {
      this.currentUserSubject.next(user);
      console.log(`Switched to user: ${user.name} (ID: ${user.id})`);
      return true;
    }
    console.error(`User with ID ${userId} not found!`);
    return false;
  }
  
  // Switch to next user (for testing)
  switchToNextUser(): void {
    if(!this.currentUser)
    {
      console.warn('No current user! Switching to first user.');
      this.switchUser(this.users[0].id);
      return;
    }
    const currentId = this.currentUser.id;
    const currentIndex = this.users.findIndex(u => u.id === currentId);
    const nextIndex = (currentIndex + 1) % this.users.length;
    this.switchUser(this.users[nextIndex].id);
  }
  // Set/update the current user
  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    // Optional: Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  
  // Update specific fields
  updateUser(updates: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (current) {
      const updated = { ...current, ...updates };
      this.currentUserSubject.next(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  }
  
  // Login - typically calls API, then sets user
  login(email: string, password: string): Observable<User> {
    // This would be an HTTP call in real app
    return new Observable(observer => {
      // Mock API response
      setTimeout(() => {
        const mockUser: User = {
          id: 1,
          name: 'John Doe',
          email: email,
          avatar: 'https://i.pravatar.cc/150?img=1',
          role: 'user',
          friends: [2, 3, 4],
          bio: 'Angular developer',
          status: 'online',
          password: 'password'
        };
        
        this.setCurrentUser(mockUser);
        observer.next(mockUser);
        observer.complete();
      }, 1000);
    });
  }
  
  // Logout
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }
  
  // Initialize from localStorage on app start
  initialize(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse saved user', e);
        this.logout();
      }
    }
  }
  
  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
  
  // Check user role
  hasRole(role: User['role']): boolean {
    return this.currentUser?.role === role;
  }
  
  // Get user's friends count
  getFriendsCount(): number {
    return this.currentUser?.friends?.length || 0;
  }
  initializeWithMockData(): void {
    const mockUser: User = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: 'user',
      friends: [2, 3, 4],
      bio: 'Angular enthusiast',
      status: 'online',
      password: 'password'
    };
    this.setCurrentUser(mockUser);
  }
}