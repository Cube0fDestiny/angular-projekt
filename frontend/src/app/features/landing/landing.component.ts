
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/home']);
      }
    });
  }

  onJoinIn(): void {
    this.router.navigate(['/login']);
  }
}
