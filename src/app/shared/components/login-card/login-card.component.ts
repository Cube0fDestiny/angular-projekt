import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login-card.component.html',
  styleUrl: './login-card.component.css'
})
export class LoginCardComponent {
  constructor(private router: Router) {}

  get isRegisterPage(): boolean {
    return this.router.url.includes('/register');
  }
}