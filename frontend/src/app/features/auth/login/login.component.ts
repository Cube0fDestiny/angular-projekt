import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarSigninupComponent } from '../../../shared/components/navbar-signinup/navbar-signinup.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { LoginCardComponent } from '../../../shared/components/login-card/login-card.component';

import { guestGuard } from '../../../core/auth/guest.guard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    NavbarSigninupComponent,
    FooterComponent,
    LoginCardComponent
  ],
  templateUrl: './login.component.html',
  providers: [],
  canActivate: [guestGuard]
})
export class LoginComponent {}
