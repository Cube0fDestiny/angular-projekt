import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf
import { FormsModule } from '@angular/forms'; // Fixes 'ngModel' error
import { Router, RouterLink } from '@angular/router'; // Fixes 'routerLink' error
import { AuthService } from '../../../core/auth/auth.service';
import { OrangButtonComponent } from "../orang-button/orang-button.component";

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    OrangButtonComponent
  ],
  templateUrl: './login-card.component.html',
  styleUrls: ['./login-card.component.css']
})
export class LoginCardComponent {
  email = '';
  password = '';
  newName = '';
  newSurname = '';
  isCompany = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  get isRegisterPage(): boolean {
    return this.router.url.includes('/register');
  }

  onHandleAuth() {
    // Reset previous error
    this.errorMessage = null;

    if (this.isRegisterPage) {
      // Basic client-side validation for sign up
      if (!this.newName || !this.newSurname || !this.email || !this.password) {
        this.errorMessage = 'Please fill in all fields before signing up.';
        return;
      }

      // For now, provide default name/surname/is_company
      this.authService.register({
        name: this.newName,
        surname: this.newSurname,
        email: this.email,
        password: this.password,
        is_company: this.isCompany
      }).subscribe({
        next: res => {
          console.log('Registered:', res);
        },
        error: err => {
          console.error('Register error:', err);
          this.errorMessage = err?.error?.message || 'Registration failed. Please check your details and try again.';
        }
      });
    } else {
      // Basic client-side validation for login
      if (!this.email || !this.password) {
        this.errorMessage = 'Please enter both email and password.';
        return;
      }

      // login expects separate arguments
      this.authService.login(this.email, this.password).subscribe({
        next: res => {
          console.log('Logged in:', res);
        },
        error: err => {
          console.error('Login error:', err);
          this.errorMessage = err?.error?.message || 'Invalid credentials. Please try again.';
        }
      });
    }
  }
}
