import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-page-sidebar.component.html',
  imports: [NgIf,NgFor,TextDisplayComponent],
  styleUrls: ['./profile-page-sidebar.component.scss']
})
export class ProfilePageSidebarComponent {
  @Input() user: any = null;
  @Input() userId: number = 0;
  // Input data
  @Input() friends: any[] = [];
  @Input() groups: any[] = [];
  @Input() photos: any[] = [];
  
  // Events
  @Output() friendClick = new EventEmitter<number>();
  @Output() groupClick = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<any>();
  
  // Navigate to friend's profile
  goToFriendProfile(friendId: number): void {
    this.friendClick.emit(friendId);
    this.router.navigate(['/profile', friendId]);
  }
  
  // Navigate to group
  goToGroup(groupId: number): void {
    this.groupClick.emit(groupId);
    // this.router.navigate(['/group', groupId]);
  }
  
  // Open photo viewer
  openPhoto(photo: any): void {
    this.photoClick.emit(photo);
  }

  constructor(
    private router: Router,
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