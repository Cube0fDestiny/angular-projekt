import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown.component';
import { UserService } from '../../../../core/services/user.service';
import { Route, Router } from '@angular/router';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule,ProfileDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  
  currentUser: any;
    
    constructor(private userService: UserService, private router: Router) {}
    
    ngOnInit() {
      // Subscribe to global user changes
      this.userService.currentUser$.subscribe(user => {
        this.currentUser = user;  // Updates automatically!
      });
    }
  
 // user = {
   // name:  this.currentUser,//'Jan Kowalski',
   // avatar: 'https://i.pravatar.cc/40'
  //};
  
  navItems = [
    { id: 'home', label: 'Strona główna', icon: '🏠' },
    { id: 'friends', label: 'Znajomi', icon: '👥', badge: 5 },
    { id: 'messages', label: 'Wiadomości', icon: '💬', badge: 12 },
    { id: 'notifications', label: 'Powiadomienia', icon: '🔔', badge: 3 }
    //, { id: 'profile', label: 'Profil', icon: '👤' }
  ];
  isDropdownOpen = false;
  activeItem = 'home';

  setActive(itemId: string): void {
    this.activeItem = itemId;
    console.log(`Kliknięto: ${itemId}`);
    if(this.activeItem=='profile')
    {
      this.goToProfile(0);
    }
    else
    {
      console.log("not profile");
    }
  }
   
  goToProfile(userId: number): void {
    // Just pass the ID - that's it!
    console.log("going to profile");
    this.router.navigate(['/profile', userId]);
    
    // OR if you want to pass the whole user object:
    // this.router.navigate(['/profile', userId], {
    //   state: { userId: userId }  // Optional, you can get it from route params
    // });
  }
    
  
}
