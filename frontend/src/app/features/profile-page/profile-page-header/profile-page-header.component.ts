import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-page-header.component.html',
  imports: [NgIf, OrangButtonComponent],
  styleUrls: ['./profile-page-header.component.scss']
})
export class ProfilePageHeaderComponent {
  @Input() user: any = null;
  @Input() isOwnProfile = false;
  @Input() isFriend = false;
  userId: number = 0;
  @Input() stats = {
    friends: 0,
    posts: 0,
    photos: 0
  };

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
  
  @Output() editProfile = new EventEmitter<void>();
  @Output() addStory = new EventEmitter<void>();
  @Output() viewAs = new EventEmitter<void>();
  @Output() message = new EventEmitter<void>();
  @Output() addFriend = new EventEmitter<void>();
  @Output() unfriend = new EventEmitter<void>();
  @Output() more = new EventEmitter<void>();
  
  // Default cover image
  coverImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop';
  
  onEditProfile(): void {
    this.editProfile.emit();
  }
  
  onAddStory(): void {
    this.addStory.emit();
  }
  
  onViewAs(): void {
    this.viewAs.emit();
  }
  
  onMessage(): void {
    this.message.emit();
  }
  
  onAddFriend(): void {
    this.addFriend.emit();
  }
  
  onUnfriend(): void {
    this.unfriend.emit();
  }
  
  onMore(): void {
    this.more.emit();
  }
}