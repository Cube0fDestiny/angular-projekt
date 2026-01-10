import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf
import { FormsModule } from '@angular/forms'; // Fixes 'ngModel' error
import { Router, RouterLink } from '@angular/router'; // Fixes 'routerLink' error
import { AuthService } from '../../../core/services/auth.service';
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
  styleUrl: './login-card.component.css'
})
export class LoginCardComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  get isRegisterPage(): boolean {
    return this.router.url.includes('/register');
  }

  onHandleAuth() {
    const data = { email: this.email, password: this.password };
    if (this.isRegisterPage) {
      this.authService.register(data);
    } else {
      this.authService.login(data);
    }
  }
}