import { CommonModule } from '@angular/common';
import { TextDisplayComponent } from '../../shared/components/text-display/text-display.component';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { UserService } from '../../core/user/user.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrangButtonComponent } from '../../shared/components/orang-button/orang-button.component';
import { FriendListItem, User, UserFriend } from '../../shared/models/user.model';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ImageService } from '../../core/image/image.service';
import { GroupService } from '../../core/group/group.service';

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
  userId: string | null = null;
  sectionTitle = 'All Friends';
  @Output() userClick = new EventEmitter<string>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private imageService: ImageService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    
    this.userId = this.route.snapshot.paramMap.get('id');
    
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);

    this.loadUser();
  }

  loadUser(): void {
    this.userService.getUserById(this.userId!).subscribe(user => {
      this.user = user;
      this.sectionTitle = `Friends of "${user.name} ${user.surname}"`;
      if(user.is_company){
        console.log('not a personal profile');
        this.router.navigate(['/']);
      } else {
        this.loadFriends();
      }
    });
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
    this.groupService.getAllFriends(this.user!.id).subscribe({
      next: (userFriends: UserFriend[]) => {
        const friendItems: FriendListItem[] = userFriends.map(userFriend => ({
          friend_id: userFriend.user_id
        }));
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
              this.imageService.getImage(user.profile_picture_id!).pipe(
                map(profile_picture_url => ({
                  ...user,
                  profile_picture_url: profile_picture_url || 'assets/logo_icon.png'
                })),
                catchError(() => of({
                  ...user,
                  profile_picture_url: 'assets/logo_icon.png'
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