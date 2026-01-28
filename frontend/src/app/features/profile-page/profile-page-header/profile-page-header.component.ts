import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { User, OutgoingFriendRequest } from '../../../shared/models/user.model';
import { ChatHttpService } from '../../../core/chat/chat-http.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ImageService } from '../../../core/image/image.service';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-page-header.component.html',
  imports: [NgIf, OrangButtonComponent, ImageUploadComponent],
  styleUrls: ['./profile-page-header.component.scss']
})
export class ProfilePageHeaderComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isOwnProfile = false;
  @Input() isFriend = false;

  headerImageUrl: string = '';
  profileImageUrl: string = '';

  /** Keep as string because backend uses UUIDs */
  userId: string | null = null;
  didSentFriendRequest = false;
  hasFriendRequest = false;
  isFollowing = false;
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

  currentUser: User | null = null;

  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    private router: Router,
    private chatHttpService: ChatHttpService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.userService.currentUser$.subscribe(u => this.currentUser = u);

    // Get userId from route (if any)
    this.userId = this.route.snapshot.paramMap.get('id');

    // Load profile data
    this.loadUser(this.userId);
  }

  loadUser(userId: string | null): void {
    if (!userId || userId === this.currentUser?.id) {
      // Show current user's profile
      this.user = this.currentUser;
      this.isOwnProfile = true;
      this.isFriend = false;
    } else {
      // Fetch another user's profile
      this.userService.getUserById(userId).subscribe(u => {
        this.user = u;
        this.isOwnProfile = false;
        this.loadFriendRequestsOutgoing();
        this.loadFriendRequestsIncoming();
        this.loadFriendStatus();
      });
    }
    this.getHeaderUrl();
    this.getProfileUrl();
    console.log('Profile for user:', this.user);
  }

  removeFriend(userId: string): void {
    this.userService.removeFriend(userId).subscribe({
      next: (response) => {
        console.log('Friend removed:', response.message);
        this.isFriend = false;
        this.didSentFriendRequest = false;
      },
      error: (error) => {
        console.error('Error removing friend:', error);
      }
    });
  }

  // Event emitters
  onEditProfile(): void { this.editProfile.emit(); }
  onAddStory(): void { this.addStory.emit(); }
  onViewAs(): void { this.viewAs.emit(); }

  onAddFriend(userId: string): void {
    console.log('sent friend request to: ', userId);
    this.addFriend.emit();
    this.userService.sendFriendRequest(userId).subscribe(u => {
      console.log('send friend request: ', u);
      this.didSentFriendRequest = true;
    });
  }

  loadFriendRequestsOutgoing(): void {
    this.userService.getFriendRequestsOutgoing().subscribe({
      next: (friendRequests) => {
        friendRequests.forEach(request => {
          if(request.to_user_id==this.userId){
            this.didSentFriendRequest = true;
          }
        });
        console.log('Loaded outcoming friend requests');
      },
      error: (error) => {
        console.error('Error loading outcoming friend requests:', error);
      }
    });
  }

  loadFriendRequestsIncoming(): void {
    this.userService.getFriendRequestsIncoming().subscribe({
      next: (friendRequests) => {
        friendRequests.forEach(request => {
          if(request.from_user_id==this.userId){
            this.hasFriendRequest = true;
          }
        });
        console.log('Loaded friend incoming requests');
      },
      error: (error) => {
        console.error('Error loading incoming friend requests:', error);
      }
    });
  }

  acceptFriendRequest(friend_id: string): void {
    this.userService.acceptFriendRequest(friend_id).subscribe({
      next: (response) => {
        console.log('Friend request accepted:', response.message);
        this.isFriend = true;
        this.hasFriendRequest = false;
      },
      error: (error) => {
        console.error('Error accepting friend request:', error);
      }
    });
  }

  loadFriendStatus():void {
    this.userService.getAllFriends().subscribe({
      next: (friendItems) => {
        console.log('loaded friends list')
        friendItems.forEach(friendItem => {
          if (friendItem.friend_id==this.userId){
            this.isFriend = true;
          }
        });
      },
      error: (error) => {
        console.error('Error loading friend list:', error);
      }
    });
  }

  toggleFollow(): void{
    this.userService.toggleFollowProfile(this.userId!).subscribe(res => {
      console.log('toggled following event: ', res);
      this.isFollowing = !this.isFollowing;
    });
  }

  checkChat():void {
    this.chatHttpService.getChats().subscribe({
      next: (chats) => {
        let check = false;
        let nameSurname = `${this.user?.name} ${this.user?.surname}`;
        chats.forEach(chat => {
          if (chat.name.includes(nameSurname)){
            check = true;
          }
        });
        if(check){
          this.router.navigate(['/chats']);
        } else{
          this.createChat();
        }
      }
    })
  }  


  createChat():void {
    const newChat = {
      name: `${this.user!.name} ${this.user!.surname} ${this.currentUser!.name} ${this.currentUser!.surname}`,
      participantIds: [this.user!.id]
    }
    this.chatHttpService.createChat(newChat).subscribe({
      next: () => {
        console.log('Successfully created new chat');
        this.router.navigate(['/chats']);
      },
      error: (error) => {
        console.error('Failed to create new chat:', error);
      }
    });
  }

  coverImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop';
  profileImage = 'assets/logo_icon.png';

  getHeaderUrl(): void {
    if (!this.user?.header_picture_id) {
      this.headerImageUrl = `url(${this.coverImage})`;
      return;
    }
    
    this.imageService.getImage(this.user.header_picture_id).subscribe({
      next: (imageUrl) => {
        this.headerImageUrl = `url(${imageUrl})`;
        console.log('laoded header image');
      },
      error: (error) => {
        console.log('failed to load header iamge: ', error);
        this.headerImageUrl = `url(${this.coverImage})`;
      }
    });
  }

  getProfileUrl(): void {
    if (!this.user?.profile_picture_id) {
      this.profileImageUrl = this.profileImage;
      return;
    }
    
    this.imageService.getImage(this.user.profile_picture_id).subscribe({
      next: (imageUrl) => {
        this.profileImageUrl = imageUrl;
        console.log('laoded profile image');
      },
      error: (error) => {
        console.log('failed to load profile iamge: ', error);
        this.profileImageUrl = this.profileImage;
      }
    });
  }

  onHeaderImageUploaded(imageId: string): void{
    this.userService.updateProfile(this.userId!, {header_picture_id: imageId}).subscribe({
      next: () => {
        console.log('changed header picture');
        this.getHeaderUrl();
      },
      error: (error) => {
        console.error('failed to change header picture: ', error);
      }
    })
  }

  onProfileImageUploaded(imageId: string): void{
    this.userService.updateProfile(this.userId!, {profile_picture_id: imageId}).subscribe({
      next: () => {
        console.log('changed profile picture');
        this.getProfileUrl();
      },
      error: (error) => {
        console.error('failed to change profile picture: ', error);
      }
    })
  }

}
