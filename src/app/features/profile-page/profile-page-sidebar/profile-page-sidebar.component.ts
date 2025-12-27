import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-page-sidebar.component.html',
  imports: [NgIf,NgFor],
  styleUrls: ['./profile-page-sidebar.component.scss']
})
export class ProfileSidebarComponent {
  @Input() userId: number = 0;
  
  // Input data
  @Input() friends: any[] = [];
  @Input() groups: any[] = [];
  @Input() photos: any[] = [];
  
  // Events
  @Output() friendClick = new EventEmitter<number>();
  @Output() groupClick = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<any>();
  
  constructor(private router: Router) {}
  
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
}