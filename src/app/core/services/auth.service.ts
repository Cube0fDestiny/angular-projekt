import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { User } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$;

  constructor(
    private router: Router, 
    private userService: UserService
  ) {
    this.user$ = this.userService.currentUser$;
    this.userService.initialize();
  }

  register(userData: any) {
    const newUser: User = {
      id: Date.now(),
      name: userData.email.split('@')[0],
      email: userData.email,
      avatar: `https://i.pravatar.cc/150?u=${userData.email}`,
      role: 'user',
      status: 'online',
      friends: [],
      groups: [],
      bio: 'New member',
      password: userData.password || 'password' // Uses default if empty
    };

    localStorage.setItem('registeredUser', JSON.stringify(newUser));
    this.userService.setCurrentUser(newUser);
    this.router.navigate(['/home']);
  }

  login(credentials: any) {
    // 1. Check hardcoded mock users (John, Jane, etc.)
    const mockUsers = this.userService.getAllUsers();
    const mockMatch = mockUsers.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );

    if (mockMatch) {
      this.userService.setCurrentUser(mockMatch);
      this.router.navigate(['/home']);
      return;
    }

    // 2. Check registered user in LocalStorage
    const savedUser = JSON.parse(localStorage.getItem('registeredUser') || 'null');
    if (savedUser && savedUser.email === credentials.email && savedUser.password === credentials.password) {
      this.userService.setCurrentUser(savedUser);
      this.router.navigate(['/home']);
      return;
    }

    alert('Invalid credentials. Try john@example.com / password');
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}