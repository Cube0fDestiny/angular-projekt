import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown.component';
import { UserService } from '../../../../core/user/user.service';
import { Route, Router } from '@angular/router';
import { NotificationsDropdownComponent } from '../notifications-dropdown/notifications-dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ProfileDropdownComponent, NotificationsDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  
  currentUser: any;
  @Input() location: string = '';
    
  constructor(private userService: UserService, private router: Router) {}
  
  ngOnInit() {
    // Subscribe to global user changes
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;  // Updates automatically!
    });
  }

  getMessageIcon(): string{
    if(this.location=='chat'){
      return `assets/icons/messages_on.png`;
    }
    return `assets/icons/messages_off.png`;
  }

  getGroupsIcon(): string{
    if(this.location=='group'){
      return `assets/icons/group_on.png`;
    }
    return `assets/icons/group_off.png`;
  }

  getEventsIcon(): string{
    if(this.location=='event'){
      return `assets/icons/events_on.png`;
    }
    return `assets/icons/events_off.png`;
  }

  getCompanyIcon(): string{
    if(this.location=='company'){
      return `assets/icons/company_on.png`;
    }
    return `assets/icons/company_off.png`;
  }

  goToHome():void {
    if (this.currentUser) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }

  goToProfile(userId: number): void {
    console.log("going to profile");
    this.router.navigate(['/']).then(() => { this.router.navigate(['/profile', userId]); });
  }

  goToEvents(): void {
    console.log("going to events");
    this.router.navigate(['/']).then(() => { this.router.navigate(['/events']); });
  }

  goToMessages(): void {
    console.log("going to messages");
    this.router.navigate(['/']).then(() => { this.router.navigate(['/chats']); });
  }

  goToGroups(): void {
    console.log("going to groups");
    this.router.navigate(['/']).then(() => { this.router.navigate(['/groups']); });
  }

  goToCompany(): void {
    console.log("going to companies");
    this.router.navigate(['/']).then(() => { this.router.navigate(['/companies']); });
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
    if(this.activeItem=='profile')
    {
      this.goToProfile(this.currentUser.id);
    }
    else if(this.activeItem=='events')
    {
      this.goToEvents();
    }
    else
    {
      console.log("not profile");
    }
  }
   

    
  
}
