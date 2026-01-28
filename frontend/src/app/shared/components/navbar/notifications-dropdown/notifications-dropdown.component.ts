import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule, NgIf } from "@angular/common";
import { Router } from '@angular/router';
import { UserService } from '../../../../core/user/user.service';
import { User, IncomingFriendRequest } from '../../../models/user.model';
import { forkJoin, map, Observable, Subscription, switchMap } from 'rxjs';
import { OrangNotification } from '../../../models/notification.model';
import { NotificationService } from '../../../../core/notification/notification.service';
import { ImageService } from '../../../../core/image/image.service';
import { PostService } from '../../../../core/post/post.service';
import { Post } from '../../../models/post.model';

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
  @Output() userClick = new EventEmitter<string>();
  
  isOpen = false;
  
  currentUser: User | null = null;

  notifications: OrangNotification[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService,
    private imageService: ImageService,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.notificationService.initializeSocket();
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        console.log('loaded notifications: ', notifications);
      })
    );
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
  
  closeDropdown() {
    this.isOpen = false;
  }

  getImageUrl(imageId: string):Observable<string> {
    return this.imageService.getImage(imageId);
  }

  getNotificationIcon(): string {
    if (this.isOpen) {
      return `assets/icons/notification_on.png`;
    }
    return `assets/icons/notification_off.png`;
  }

  acceptFriendRequest(notificationId: string, friendRequestId: string): void {
    this.userService.acceptFriendRequest(friendRequestId).subscribe({
      next: (response) => {
        console.log('Friend request accepted:', response.message);
        this.notificationService.deleteNotification(notificationId).subscribe({
          next: (message) => {
            console.log('deleted notification: ', message);
          },
          error: (error) => {
            console.error('failed to delere notification: ', error);
          }
        });
      },
      error: (error) => {
        console.error('Error accepting friend request:', error);
      }
    });
  }

  rejectFriendRequest(notificationId: string, friendRequestId: string): void {
    this.userService.rejectFriendRequest(friendRequestId).subscribe({
      next: (response) => {
        console.log('Friend request rejected:', response.message);
        this.notificationService.deleteNotification(notificationId).subscribe({
          next: (message) => {
            console.log('deleted notification: ', message);
          },
          error: (error) => {
            console.error('failed to delere notification: ', error);
          }
        });
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

  goToPost(notificationId: string,postId: string):void {
    this.postService.getPostById(postId).subscribe({
      next: (post) => {
        this.deleteNotification(notificationId);
        console.log('navigating to post...');
        this.router.navigate(['/']).then(() => { this.router.navigate([`/${post.location_type}/${post.location_id}/${post.id}`]); });
      },
      error: (error) => {
        console.error('failed to route to the post: ', error);
      }
    });
  }
  deleteNotification(notificationId: string):void{
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: (message) => {
        console.log('deleted notification: ', message);
      },
      error: (error) => {
        console.error('failed to delere notification: ', error);
      }
    });
  }

  goToChats(notificationId: string):void {
    this.deleteNotification(notificationId);
    this.router.navigate(['/chats']);
  }
}