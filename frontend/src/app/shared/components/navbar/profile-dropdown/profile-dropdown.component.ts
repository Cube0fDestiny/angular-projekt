import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from "@angular/common";
import { Router } from '@angular/router';
import { UserService } from '../../../../core/user/user.service';
import { AuthService } from '../../../../core/auth/auth.service'; // Added this
import { ImageService } from '../../../../core/image/image.service';

@Component({
  selector: 'profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
  standalone: true, // Assuming standalone based on previous context
  imports: [NgIf, CommonModule]
})
export class ProfileDropdownComponent implements OnInit {
  @Output() profileClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  @Input() user: any;
  currentUserProfile = 'assets/logo_icon.png';
  showProfileImage = false;
  
  isOpen = false;
  currentUser: any;

  // Injecting AuthService to handle the actual logout logic
  private authService = inject(AuthService);

  constructor(private router: Router, private userService: UserService, private imageService: ImageService) {}
 
  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.imageService.getImage(user?.profile_picture_id!).subscribe({
        next: (url) => {
          this.currentUserProfile = url;
          this.showProfileImage = true;
        }
      });
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
  
  closeDropdown() {
    this.isOpen = false;
  }
  
  onProfileClick() {
    if (this.currentUser?.id) {
      this.goToProfile(this.currentUser.id);
    }
    this.closeDropdown();
  }
  
  onSettingsClick() {
    this.settingsClick.emit();
    this.router.navigate(['/settings']);
    this.closeDropdown();
  }
  
  // FIXED: Now calls the AuthService to perform the system logout
  onLogoutClick() {
    this.authService.logout(); // Clears localStorage and redirects to /login
    this.logoutClick.emit();
    this.closeDropdown();
  }

  goToProfile(userId: number): void {
    this.router.navigate(['/profile', userId]);
    this.closeDropdown();
  }
}