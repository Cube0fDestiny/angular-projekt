import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { ProfilePageHeaderComponent } from '../profile-page-header/profile-page-header.component';
import { ProfilePageSidebarComponent } from '../profile-page-sidebar/profile-page-sidebar.component';
import { WallComponent } from '../../../shared/components/wall/wall.component';
import { NavbarComponent } from '../../../shared/components/navbar/main/navbar.component';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ProfilePageHeaderComponent, ProfilePageSidebarComponent, WallComponent, NavbarComponent],
  templateUrl: './profile-page.component.html'
})
export class ProfilePageComponent implements OnInit {
  userId: string | null = null;
  user: User | null = null;
  highlightedPostId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    // Get userId from route (UUID string)
    this.userId = this.route.snapshot.paramMap.get('id');
    this.highlightedPostId = this.route.snapshot.paramMap.get('postId');
    this.loadUser(this.userId);
  }

  loadUser(userId: string | null): void {
    if (!userId || userId === this.userService.currentUser?.id) {
      // Show current user's profile
      this.user = this.userService.currentUser;
    } else {
      // Fetch another user's profile
      this.userService.getUserById(userId).subscribe(u => {
        this.user = u;
      });
    }

    console.log('Profile for user:', this.user);
  }
}
