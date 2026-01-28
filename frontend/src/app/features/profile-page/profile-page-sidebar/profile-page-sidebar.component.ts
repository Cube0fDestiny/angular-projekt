import { NgFor, NgIf } from '@angular/common';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User, FriendListItem, UserFollower, UserFriend } from '../../../shared/models/user.model';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { catchError, forkJoin, map, of } from 'rxjs';
import { ImageService } from '../../../core/image/image.service';
import { GroupService } from '../../../core/group/group.service';
import { Group } from '../../../shared/models/group.model';

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-page-sidebar.component.html',
  imports: [NgIf, FormsModule, NgFor, TextDisplayComponent, OrangButtonComponent],
  styleUrls: ['./profile-page-sidebar.component.scss']
})
export class ProfilePageSidebarComponent implements OnInit {

  /** Main profile user */
  @Input() user!: User | null;

  /** Placeholder for groups and photos (mock) */
  @Input() groups: Group[] = [];
  @Input() photos: any[] = [];

  /** Events for interactions */
  @Output() userClick = new EventEmitter<string>();
  @Output() groupClick = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<any>();

  /** All users used to display as "friends" temporarily */
  friends: User[] = [];
  isLoading = true;

  /** Current logged-in user */
  currentUser!: User | null;
  followers: UserFollower[] = [];
  loadedFollowers = false;

  isEditingBio = false;
  editedBio = '';
  defaultImage = 'assets/logo_icon.png';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private imageService: ImageService,
    private groupService: GroupService
  ) {}

  toggleEditingBio():void {
    console.log("toggledBio");
    this.isEditingBio = !this.isEditingBio;
    if (this.isEditingBio) {
      this.editedBio = this.user?.bio || '';
    }
  }

  updateBio():void {
    if (!this.editedBio?.trim() || this.editedBio === this.user!.bio) {
      this.isEditingBio = false;
      return;
    }
    
    const updatedProfile = {
      bio: this.editedBio
    }

    this.userService.updateProfile(this.user!.id, updatedProfile).subscribe({
      next: () => {
        this.user!.bio = this.editedBio;
        console.log('Succesfully updated bio')
        this.isEditingBio = false;
      },
      error: (error) => {
        console.error('Failed to update bio:', error);
        this.isEditingBio = false;
      }
    });
  }

  userId!: string | null;

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');

    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadUser();
  }

  loadUser(): void{
    this.userService.getUserById(this.userId!).subscribe({
      next: (user) => {
        this.user = user;
        this.loadAllGroups();
        if(user?.is_company){
          this.loadFollowers();
        }else{
          this.loadFriends();
        }
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
            
            // Process users - ONLY load avatars for those with profile_picture_id
            const processedUsers$ = validUsers.map(user => {
              if (!user.profile_picture_id) {
                // No profile picture ID, use default immediately
                return of({
                  ...user,
                  profile_picture_url: 'assets/logo_icon.png'
                });
              }
              
              // Has profile picture ID, load it
              return this.imageService.getImage(user.profile_picture_id).pipe(
                map(profile_picture_url => ({
                  ...user,
                  profile_picture_url: profile_picture_url || 'assets/logo_icon.png'
                })),
                catchError(() => of({
                  ...user,
                  profile_picture_url: 'assets/logo_icon.png'
                }))
              );
            });
            
            // Wait for all processing (mix of immediate values and HTTP requests)
            forkJoin(processedUsers$).subscribe({
              next: (usersWithAvatars) => {
                this.friends = usersWithAvatars;
                console.log('Loaded all friends with avatars:', this.friends.length);
              },
              error: (error) => {
                console.error('Error processing friends:', error);
                this.friends = validUsers.map(user => ({
                  ...user,
                  profile_picture_url: 'assets/logo_icon.png'
                }));
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

  goToFriendsList(): void {
    console.log('navigating to friends list...');
    this.router.navigate(['/friends', this.user!.id]);
  }

  goToFollowerList(): void {
    console.log('navigating to follower list...');
    this.router.navigate(['/followerslist', this.user!.id]);
  }

  /** Navigate to another user's profile */
  goToFriendProfile(userId: string): void {
    this.userClick.emit(userId);
    this.router.navigate(['/']).then(() => { this.router.navigate(['/profile', userId]); });
  }


  goToGroup(groupId: string): void {
    this.router.navigate(['/group', groupId]);
  }

  loadAllGroups(): void {
    this.isLoading = true;
    this.groupService.getUserGroups(this.user?.id!).subscribe({
      next: (groups) => {
        this.groups = groups;
        this.isLoading = false;
        this.loadProfileImages();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading groups:', error);
      }
    });
  }

  loadProfileImages(): void {
    if (!this.groups) return;
    
    this.groups.forEach(group => {
      if (group.profile_picture_id) {
        this.imageService.getImage(group.profile_picture_id).subscribe({
          next: (imageUrl) => {
            group.profileImageUrl = imageUrl;
          },
          error: () => {
            group.profileImageUrl = this.defaultImage;
          }
        });
      } else {
        group.profileImageUrl = this.defaultImage;
      }
    });
  }

  /** Open photo (mock) */
  openPhoto(photo: any): void {
    this.photoClick.emit(photo);
  }

  loadFollowers():void {
    this.userService.getAllFollowers(this.user!.id).subscribe(followers => {
      console.log('followers: ', followers);
      if(followers.length==0){
        this.loadedFollowers = true;
        this.followers = [];
        console.log('loaded empty follower list');
      } else {
        followers.forEach(follower => {
          if(!follower.avatar){
            follower.profile_picture_url = 'assets/logo_icon.png';
          }else{
            this.imageService.getImage(follower.avatar).subscribe({
              next: (url) => {
                follower.profile_picture_url = url;
              }
            });
          }
        });
        this.followers = followers;
        console.log('loaded follower profiles');
        this.loadedFollowers = true;
      }
      
    })
  }
}

