import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown.component';
import { UserService } from '../../../../core/user/user.service';
import { Router } from '@angular/router';
import { NotificationsDropdownComponent } from '../notifications-dropdown/notifications-dropdown.component';
import { ImageService } from '../../../../core/image/image.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ProfileDropdownComponent, NotificationsDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  
  currentUser: any;
  currentUserAvatar: string = 'assets/logo_icon.png';
  defaultAvatar: string = 'assets/logo_icon.png';
  
  @Input() location: string = '';
  
  private subscriptions: Subscription[] = [];
    
  constructor(
    private userService: UserService, 
    private router: Router,
    private imageService: ImageService
  ) {}
  
  ngOnInit() {
    const userSub = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadCurrentUserAvatar();
      }
    });
    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCurrentUserAvatar(): void {
    if (this.currentUser?.profile_picture_id) {
      this.imageService.getImage(this.currentUser.profile_picture_id).subscribe({
        next: (imageUrl: string) => {
          this.currentUserAvatar = imageUrl;
        },
        error: () => {
          this.currentUserAvatar = this.defaultAvatar;
        },
      });
    } else {
      this.currentUserAvatar = this.defaultAvatar;
    }
  }

  getMessageIcon(): string {
    if (this.location === 'chat') {
      return 'assets/icons/messages_on.png';
    }
    return 'assets/icons/messages_off.png';
  }

  getGroupsIcon(): string {
    if (this.location === 'group') {
      return 'assets/icons/group_on.png';
    }
    return 'assets/icons/group_off.png';
  }

  getEventsIcon(): string {
    if (this.location === 'event') {
      return 'assets/icons/events_on.png';
    }
    return 'assets/icons/events_off.png';
  }

  getCompanyIcon(): string {
    if (this.location === 'company') {
      return 'assets/icons/company_on.png';
    }
    return 'assets/icons/company_off.png';
  }

  goToHome(): void {
    if (this.currentUser) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }

  goToProfile(userId: string): void {
    console.log('going to profile');
    this.router.navigate(['/profile', userId]);
  }

  goToEvents(): void {
    console.log('going to events');
    this.router.navigate(['/events']);
  }

  goToMessages(): void {
    console.log('going to messages');
    this.router.navigate(['/chats']);
  }

  goToGroups(): void {
    console.log('going to groups');
    this.router.navigate(['/groups']);
  }

  goToCompany(): void {
    console.log('going to companies');
    this.router.navigate(['/companies']);
  }

  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isMobileSearchOpen = false;
  activeItem = 'home';

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isMobileSearchOpen = false;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    this.isMobileMenuOpen = false;
  }

  closeMobileSearch(): void {
    this.isMobileSearchOpen = false;
  }

  setActive(itemId: string): void {
    this.activeItem = itemId;
    console.log(`Kliknięto: ${itemId}`);
    if (this.activeItem === 'profile') {
      this.goToProfile(this.currentUser.id);
    } else if (this.activeItem === 'events') {
      this.goToEvents();
    } else {
      console.log('not profile');
    }
  }
}