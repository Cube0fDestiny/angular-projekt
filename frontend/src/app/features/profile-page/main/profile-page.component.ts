import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ProfilePageHeaderComponent } from '../profile-page-header/profile-page-header.component';
import { ProfilePageSidebarComponent } from '../profile-page-sidebar/profile-page-sidebar.component';
import { WallComponent } from '../../../shared/components/wall/wall.component';
import { NavbarComponent } from '../../../shared/components/navbar/main/navbar.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [NgIf, ProfilePageHeaderComponent, ProfilePageSidebarComponent, WallComponent,NavbarComponent],
  templateUrl: './profile-page.component.html'
})
export class ProfilePageComponent implements OnInit {
  userId: number = 0;
  user: any = null;
  
  constructor(
    private route: ActivatedRoute,
    public userService: UserService
  ) {}
  
  ngOnInit(): void {
    // Get userId from URL
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Load user data based on ID
    this.loadUser(this.userId);
  }
  
  loadUser(userId: number): void {
    // Fetch user data - in real app from API
    // For now, check if it's current user or a friend
    
    const currentUser = this.userService.currentUser;
    
    if (userId === currentUser?.id) {
      // It's the current user's own profile
      this.user = currentUser;
    } else {
      // It's someone else - create mock data based on ID
      this.user = {
        id: userId,
        name: `User ${userId}`,
        avatar: `https://i.pravatar.cc/150?img=${userId}`,
        bio: `This is user ${userId}'s profile`,
        isFriend: currentUser?.friends?.includes(userId) || false
      };
    }
    
    console.log('Profile for user:', this.user);
  }
}