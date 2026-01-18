import { Component, EventEmitter, Output, Input, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from "@angular/common";
import { Router, ActivatedRoute } from '@angular/router';
import { OrangButtonComponent } from '../../../../shared/components/orang-button/orang-button.component';
import { UserService } from '../../../../core/user/user.service';
import { User, IncomingFriendRequest } from '../../../models/user.model';
import { forkJoin, map, switchMap } from 'rxjs';

@Component({
  selector: 'notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.scss'],
  standalone: true, // Assuming standalone based on previous context
  imports: [NgIf, CommonModule, OrangButtonComponent]
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
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    console.log('current user: ', this.currentUser);
    // Load friend requests with user data
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
        
        // Create array of user fetch observables
        const userObservables = requests.map(request =>
          this.userService.getUserById(request.from_user_id).pipe(
            map(user => [request, user] as [IncomingFriendRequest, User])
          )
        );
        
        // Fetch all users in parallel
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
        
        // Remove from both arrays
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
    // Note: Using friendRequest.from_user_id as the request ID
    // If your API expects a different ID format, adjust accordingly
    this.userService.rejectFriendRequest(friendRequest.from_user_id).subscribe({
      next: (response) => {
        console.log('Friend request rejected:', response.message);
        
        // Remove from both arrays
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