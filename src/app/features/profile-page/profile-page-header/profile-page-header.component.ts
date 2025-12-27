import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-page-header.component.html',
  imports:[NgIf],
  styleUrls: ['./profile-page-header.component.scss']
})
export class ProfileHeaderComponent {
  @Input() user: any = null;
  @Input() isOwnProfile = false;
  @Input() isFriend = false;
  @Input() stats = {
    friends: 0,
    posts: 0,
    photos: 0
  };
  
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