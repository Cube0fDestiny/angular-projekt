import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from "@angular/common";
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/user/user.service';
import { User, IncomingFriendRequest } from '../../../models/user.model';
import { forkJoin, map, switchMap } from 'rxjs';

@Component({
  selector: 'notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.scss'],
  standalone: true,
  imports: [NgIf, CommonModule]
})
export class NotificationsDropdownComponent implements OnInit {
  @Output() profileClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  
  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
  
  closeDropdown() {
    this.isOpen = false;
  }

  getNotificationIcon(): string {
    if (this.isOpen) {
      return `assets/icons/notification_on.png`;
    }
    return `assets/icons/notification_off.png`;
  }
  
  sectionTitle = 'All Friends';
  @Output() userClick = new EventEmitter<string>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  friendRequestsRaw: IncomingFriendRequest[] = [];
  friendRequests: Array<[IncomingFriendRequest, User]> = [];
  currentUser: User | null = null;

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    console.log('current user: ', this.currentUser);
    this.loadFriendRequestsWithUsers();
  }

  loadFriendRequestsWithUsers(): void {
    this.userService.getFriendRequestsIncoming().pipe(
      switchMap(requests => {
        this.friendRequestsRaw = requests;
        console.log('friend requests: ', this.friendRequestsRaw);
        if (requests.length === 0) {
          return [];
        }
        
        const userObservables = requests.map(request =>
          this.userService.getUserById(request.from_user_id).pipe(
            map(user => [request, user] as [IncomingFriendRequest, User])
          )
        );
        
        return forkJoin(userObservables);
      })
    ).subscribe({
      next: (friendRequestsWithUsers) => {
        this.friendRequests = friendRequestsWithUsers;
        console.log('Loaded friend requests');
      },
      error: (error) => {
        console.error('Error loading friend requests:', error);
        this.friendRequests = [];
      }
    });
  }

  acceptFriendRequest(friendRequest: IncomingFriendRequest): void {
    this.userService.acceptFriendRequest(friendRequest.from_user_id).subscribe({
      next: (response) => {
        console.log('Friend request accepted:', response.message);
        
        this.friendRequestsRaw = this.friendRequestsRaw.filter(
          req => req.from_user_id !== friendRequest.from_user_id
        );
        
        this.friendRequests = this.friendRequests.filter(
          ([req, user]) => req.from_user_id !== friendRequest.from_user_id
        );
      },
      error: (error) => {
        console.error('Error accepting friend request:', error);
      }
    });
  }

  rejectFriendRequest(friendRequest: IncomingFriendRequest): void {
    this.userService.rejectFriendRequest(friendRequest.from_user_id).subscribe({
      next: (response) => {
        console.log('Friend request rejected:', response.message);
        
        this.friendRequestsRaw = this.friendRequestsRaw.filter(
          req => req.from_user_id !== friendRequest.from_user_id
        );
        
        this.friendRequests = this.friendRequests.filter(
          ([req, user]) => req.from_user_id !== friendRequest.from_user_id
        );
      },
      error: (error) => {
        console.error('Error rejecting friend request:', error);
      }
    });
  }

  goToProfile(userId: string): void {
    this.userClick.emit(userId);
    this.router.navigate(['/']).then(() => { this.router.navigate(['/profile', userId]); });
  }
}