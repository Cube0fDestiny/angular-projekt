import { CommonModule } from '@angular/common';
import { TextDisplayComponent } from '../../shared/components/text-display/text-display.component';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { UserService } from '../../core/user/user.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrangButtonComponent } from '../../shared/components/orang-button/orang-button.component';
import { FriendListItem, User } from '../../shared/models/user.model';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ImageService } from '../../core/image/image.service';

@Component({
  selector: 'app-friend-list',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TextDisplayComponent,
    OrangButtonComponent,
    FormsModule
  ],
  templateUrl: './friend-list.component.html',
})
export class FriendListComponent implements OnInit {
  friends: User[] = [];
  user!: User;
  currentUser!: User | null;
  sectionTitle = 'All Friends';
  @Output() userClick = new EventEmitter<string>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    
    const userId = this.route.snapshot.paramMap.get('id');
    
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);

    // Load main profile (either from route or current user)
    if (userId) {
      this.userService.getUserById(userId).subscribe(u => this.user = u);
    } else {
      this.user = this.currentUser!;
    }
    
    // Load all users as "friends" for temporary display
    this.loadFriends();
  }

  goToFriendProfile(userId: string): void {
    this.userClick.emit(userId);
    this.router.navigate(['/profile', userId]);
  }

  removeFriend(userId: string): void {
    this.userService.removeFriend(userId).subscribe({
      next: (response) => {
        console.log('Friend removed:', response.message);
        
        this.friends = this.friends.filter(friend => friend.id !== userId);
      },
      error: (error) => {
        console.error('Error removing friend:', error);
      }
    });
  }

  loadFriends(): void {
    this.userService.getAllFriends().subscribe({
      next: (friendItems: FriendListItem[]) => {
        if (friendItems.length === 0) {
          this.friends = [];
          console.log('No friends loaded');
          return;
        }
        
        const friendIds = friendItems.map(item => item.friend_id);
        const friendObservables = friendIds.map(id => 
          this.userService.getUserById(id)
        );
        
        forkJoin(friendObservables).subscribe({
          next: (users) => {
            // Filter out null users first
            const validUsers = users.filter(user => user !== null) as User[];
            
            // Load avatars for each user
            const avatarObservables = validUsers.map(user => 
              this.imageService.getImage(user.avatar).pipe(
                map(avatarUrl => ({
                  ...user,
                  avatarUrl: avatarUrl || 'assets/logo_icon.png'
                })),
                catchError(() => of({
                  ...user,
                  avatarUrl: 'assets/logo_icon.png'
                }))
              )
            );
            
            // Wait for all avatar requests
            forkJoin(avatarObservables).subscribe({
              next: (usersWithAvatars) => {
                this.friends = usersWithAvatars;
                console.log('Loaded all friends with avatars:', this.friends.length);
              },
              error: (error) => {
                console.error('Error loading avatars:', error);
                this.friends = validUsers; // Use users without avatars
              }
            });
          },
          error: (error) => {
            console.error('Error loading friends:', error);
            this.friends = [];
          }
        });
      },
      error: (error) => {
        console.error('Error loading friend list:', error);
        this.friends = [];
      }
    });
  }

  
}