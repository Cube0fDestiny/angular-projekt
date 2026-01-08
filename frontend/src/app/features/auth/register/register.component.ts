import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarSigninupComponent } from '../../../shared/components/navbar-signinup/navbar-signinup.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { LoginCardComponent } from '../../../shared/components/login-card/login-card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    NavbarSigninupComponent,
    FooterComponent,
    LoginCardComponent
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {}
