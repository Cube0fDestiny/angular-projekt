import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { UserService } from '../../../core/user/user.service';
import { ImageService } from '../../../core/image/image.service';
import { FriendListItem, IncomingFriendRequest, OutgoingFriendRequest, User } from '../../../shared/models/user.model';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  imports: [NgFor, NgIf, OrangButtonComponent],
  styleUrls: ['./right-sidebar.component.scss']
})
export class RightSidebarComponent implements OnInit {
  friends: Array<User & { profileImageUrl?: string }> = [];

  friendRequests: Array<{ request: IncomingFriendRequest; user: User & { profileImageUrl?: string } }> = [];

  suggestedPeople: Array<User & { profileImageUrl?: string }> = [];

  private outgoingRequests: OutgoingFriendRequest[] = [];
  private friendItems: FriendListItem[] = [];

  currentUser: User | null = null;
  readonly defaultAvatar = 'assets/logo_icon.png';

  constructor(
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly imageService: ImageService,
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadFriends();
        this.loadFriendRequests();
        this.loadOutgoingRequests();
      }
    });
  }

  // Load profile image for a single user
  private loadUserProfileImage(user: User & { profileImageUrl?: string }): void {
    if (user.profile_picture_id) {
      this.imageService.getImage(user.profile_picture_id).subscribe({
        next: (imageUrl: string) => {
          user.profileImageUrl = imageUrl;
        },
        error: () => {
          user.profileImageUrl = this.defaultAvatar;
        },
      });
    } else {
      user.profileImageUrl = this.defaultAvatar;
    }
  }

  // Load profile images for an array of users
  private loadUserProfileImages(users: Array<User & { profileImageUrl?: string }>): void {
    if (!users) return;
    users.forEach((user) => this.loadUserProfileImage(user));
  }

  // FRIENDS
  private loadFriends(): void {
    this.userService
      .getAllFriends()
      .pipe(
        switchMap((items: FriendListItem[]) => {
          this.friendItems = items;
          if (!items.length) {
            return of<User[]>([]);
          }
          const requests = items.map((item) =>
            this.userService.getUserById(item.friend_id),
          );
          return forkJoin(requests);
        }),
      )
      .subscribe({
        next: (users) => {
          this.friends = users;
          this.loadUserProfileImages(this.friends);
          this.loadSuggestionsIfReady();
        },
        error: (error) => {
          console.error('Error loading friends list:', error);
          this.friends = [];
        },
      });
  }

  // FRIEND REQUESTS
  private loadFriendRequests(): void {
    this.userService
      .getFriendRequestsIncoming()
      .pipe(
        switchMap((requests: IncomingFriendRequest[]) => {
          if (!requests.length) {
            this.friendRequests = [];
            this.loadSuggestionsIfReady();
            return of<
              Array<{ request: IncomingFriendRequest; user: User }>
            >([]);
          }

          const calls = requests.map((req) =>
            this.userService.getUserById(req.from_user_id).pipe(
              switchMap((user) =>
                of({ request: req, user } as {
                  request: IncomingFriendRequest;
                  user: User;
                }),
              ),
            ),
          );

          return forkJoin(calls);
        }),
      )
      .subscribe({
        next: (items) => {
          this.friendRequests = items;
          // Load profile images for friend request users
          this.friendRequests.forEach((item) => this.loadUserProfileImage(item.user));
          this.loadSuggestionsIfReady();
        },
        error: (error) => {
          console.error('Error loading friend requests:', error);
          this.friendRequests = [];
        },
      });
  }

  private loadOutgoingRequests(): void {
    this.userService.getFriendRequestsOutgoing().subscribe({
      next: (requests) => {
        this.outgoingRequests = requests;
        this.loadSuggestionsIfReady();
      },
      error: (error) => {
        console.error('Error loading outgoing friend requests:', error);
        this.outgoingRequests = [];
      },
    });
  }

  // PEOPLE YOU MAY KNOW
  private loadSuggestionsIfReady(): void {
    if (!this.currentUser) return;

    if (this.friendItems === undefined || this.outgoingRequests === undefined) {
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const currentId = this.currentUser!.id;
        const friendIds = new Set(this.friendItems.map((f) => f.friend_id));
        const incomingIds = new Set(
          this.friendRequests.map((fr) => fr.request.from_user_id),
        );
        const outgoingIds = new Set(
          this.outgoingRequests.map((r) => r.to_user_id),
        );

        this.suggestedPeople = users
          .filter((u) => u.id !== currentId)
          .filter((u) => !friendIds.has(u.id))
          .filter((u) => !incomingIds.has(u.id))
          .filter((u) => !outgoingIds.has(u.id))
          .slice(0, 10);
        
        // Load profile images for suggested people
        this.loadUserProfileImages(this.suggestedPeople);
      },
      error: (error) => {
        console.error('Error loading user suggestions:', error);
        this.suggestedPeople = [];
      },
    });
  }

  // UI handlers
  goToProfile(userId: string): void {
    this.router.navigate(['/']).then(() => {
      this.router.navigate(['/profile', userId]);
    });
  }

  acceptRequest(item: { request: IncomingFriendRequest; user: User }): void {
    const userId = item.request.from_user_id;
    this.userService.acceptFriendRequest(userId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(
          (fr) => fr.request.from_user_id !== userId,
        );
        this.loadFriends();
      },
      error: (error) => {
        console.error('Error accepting friend request:', error);
      },
    });
  }

  rejectRequest(item: { request: IncomingFriendRequest; user: User }): void {
    const userId = item.request.from_user_id;
    this.userService.rejectFriendRequest(userId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(
          (fr) => fr.request.from_user_id !== userId,
        );
        this.loadSuggestionsIfReady();
      },
      error: (error) => {
        console.error('Error rejecting friend request:', error);
      },
    });
  }

  sendFriendRequest(userId: string): void {
    this.userService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.suggestedPeople = this.suggestedPeople.filter(
          (u) => u.id !== userId,
        );
      },
      error: (error) => {
        console.error('Error sending friend request:', error);
      },
    });
  }
}