import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
@Component({
  selector: 'app-navbar-signinup',
  standalone: true,
  imports: [CommonModule,OrangButtonComponent],
  templateUrl: './navbar-signinup.component.html',
})
export class NavbarSigninupComponent {

  constructor(private router: Router) {}

  get isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  get isRegisterPage(): boolean {
    return this.router.url.includes('/register');
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  goRegister(): void {
    this.router.navigate(['/register']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
