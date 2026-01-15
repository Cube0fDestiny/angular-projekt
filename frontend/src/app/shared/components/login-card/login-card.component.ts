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

  constructor(private authService: AuthService, private router: Router) {}

  get isRegisterPage(): boolean {
    return this.router.url.includes('/register');
  }

  onHandleAuth() {
    if (this.isRegisterPage) {
      // For now, provide default name/surname/is_company
      this.authService.register({
        name: this.newName,
        surname: this.newSurname,
        email: this.email,
        password: this.password,
        is_company: false
      }).subscribe({
        next: res => console.log('Registered:', res),
        error: err => console.error('Register error:', err)
      });
    } else {
      // login expects separate arguments
      this.authService.login(this.email, this.password).subscribe({
        next: res => console.log('Logged in:', res),
        error: err => console.error('Login error:', err)
      });
    }
  }
}
