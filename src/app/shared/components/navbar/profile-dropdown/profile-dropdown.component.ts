import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule,NgIf } from "@angular/common";
import { Router } from '@angular/router';

import { UserService } from '../../../../core/services/user.service';
@Component({
  selector: 'profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
  imports: [NgIf]
})
export class ProfileDropdownComponent {
  @Output() profileClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  @Input() user: any;
  isOpen = false;
  
  currentUser: any;
 
  ngOnInit() {
    // Subscribe to global user changes

    console.log("aaaaaa");
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;  // Updates automatically!
    });
  }
// G
  
  constructor(private router: Router,private userService: UserService) {}
  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
  
  closeDropdown() {
    this.isOpen = false;
  }
  
  onProfileClick() {
    console.log("aaaaaa");
    this.goToProfile(this.currentUser.id);
    //this.profileClick.emit();
    ///this.closeDropdown();
  }
  
  onSettingsClick() {
    this.settingsClick.emit();
    this.closeDropdown();
  }
  
  onLogoutClick() {
    this.logoutClick.emit();
    this.closeDropdown();
  }
  goToProfile(userId: number): void {
    // Just pass the ID - that's it!
    this.router.navigate(['/profile', userId]);
    
    // OR if you want to pass the whole user object:
    // this.router.navigate(['/profile', userId], {
    //   state: { userId: userId }  // Optional, you can get it from route params
    // });
  }
}