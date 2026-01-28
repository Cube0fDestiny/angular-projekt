import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { User, OutgoingFriendRequest } from '../../../shared/models/user.model';
import { Group, GroupMember } from '../../../shared/models/group.model';
import { GroupService } from '../../../core/group/group.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ImageService } from '../../../core/image/image.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-group-header',
  templateUrl: './group-page-header.component.html',
  imports: [NgIf, OrangButtonComponent, ImageUploadComponent],
  styleUrls: ['./group-page-header.component.scss']
})
export class GroupPageHeaderComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isOwnGroup = false;
  headerImageUrl: string = '';
  profileImageUrl: string = '';

  group: Group | null = null;
  groupId: string | null = null;

  /** Keep as string because backend uses UUIDs */
  userId: string | null = null;
  isFollowing = false;

  /** Default cover image */
  coverImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop';
  profileImage = 'assets/logo_icon.png';

  getHeaderUrl(): void {
    if (!this.group?.header_picture_id) {
      this.headerImageUrl = `url(${this.coverImage})`;
      return;
    }
    
    this.imageService.getImage(this.group.header_picture_id).subscribe({
      next: (imageUrl) => {
        this.headerImageUrl = `url(${imageUrl})`;
        console.log('laoded header image');
      },
      error: () => {
        this.headerImageUrl = `url(${this.coverImage})`;
      }
    });
  }

  getProfileUrl(): void {
    if (!this.group?.profile_picture_id) {
      this.profileImageUrl = this.profileImage;
      return;
    }
    
    this.imageService.getImage(this.group.profile_picture_id).subscribe({
      next: (imageUrl) => {
        this.profileImageUrl = imageUrl;
        console.log('laoded profile image');
      },
      error: () => {
        this.profileImageUrl = this.profileImage;
      }
    });
  }

  @Output() editProfile = new EventEmitter<void>();
  @Output() addStory = new EventEmitter<void>();
  @Output() viewAs = new EventEmitter<void>();
  @Output() message = new EventEmitter<void>();
  @Output() addFriend = new EventEmitter<void>();
  @Output() unfriend = new EventEmitter<void>();
  @Output() more = new EventEmitter<void>();

  currentUser: User | null = null;
  members: GroupMember[] = [];

  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    public groupService: GroupService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.userService.currentUser$.subscribe(u => this.currentUser = u);

    // Get userId from route (if any)
    this.groupId = this.route.snapshot.paramMap.get('id');

    // Load profile data
    this.loadGroup();
  }

  joinGroup():void{
    this.groupService.sendJoinGroupRequest(this.groupId!).subscribe({
      next: (res) => {
        console.log('succesfully send group join innvite: ', res);
      },
      error: (error) => {
        console.error('failed to send group join request: ', error);
      }
    });
  }

  leaveGroup():void{
    this.groupService.leaveGroup(this.groupId!).subscribe({
      next: (res) => {
        console.log('succesfully left group: ', res);
        this.isFollowing = !this.isFollowing;
      },
      error: (error) => {
        console.error('failed to leave group: ', error);
      }
    });
  }

  onHeaderImageUploaded(imageId: string): void{
    this.groupService.updateGroup(this.groupId!, {header_picture_id: imageId}).subscribe({
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
    this.groupService.updateGroup(this.groupId!, {profile_picture_id: imageId}).subscribe({
      next: () => {
        console.log('changed profile picture');
        this.getProfileUrl();
      },
      error: (error) => {
        console.error('failed to change profile picture: ', error);
      }
    })
  }

  loadGroup(): void {
    console.log('function hapend: ', this.groupId);
    this.groupService.getGroupById(this.groupId!).subscribe(group => {
      this.group = group;
      if(this.currentUser!.id==group.member_data.owner_id){
        this.isOwnGroup = true;
      }
      this.loadFollowingState();
      this.getHeaderUrl();
      this.getProfileUrl()
    });
  }

  loadFollowingState():void {
    this.groupService.getGroupMembers(this.groupId!).subscribe({
      next: (members) => {
        this.members = members;
        members.forEach(member => {
          if(member.user_id==this.currentUser!.id){
            this.isFollowing = true;
          }
          console.log('loaded member status');
        });
      }
    });
  }

}
