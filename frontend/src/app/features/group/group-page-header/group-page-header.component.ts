import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { User, OutgoingFriendRequest } from '../../../shared/models/user.model';
import { Group, GroupMember } from '../../../shared/models/group.model';
import { GroupService } from '../../../core/group/group.service';

@Component({
  selector: 'app-group-header',
  templateUrl: './group-page-header.component.html',
  imports: [NgIf, OrangButtonComponent],
  styleUrls: ['./group-page-header.component.scss']
})
export class GroupPageHeaderComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isOwnGroup = false;
  @Input() isFriend = false;

  group: Group | null = null;
  groupId: string | null = null;

  /** Keep as string because backend uses UUIDs */
  userId: string | null = null;
  isFollowing = false;

  /** Default cover image */
  coverImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop';

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
    public groupService: GroupService
  ) {}

  getAvatarUrl(group: Group): string {
    return group?.profile_picture_id || 'assets/logo_icon.png';
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.userService.currentUser$.subscribe(u => this.currentUser = u);

    // Get userId from route (if any)
    this.groupId = this.route.snapshot.paramMap.get('id');

    // Load profile data
    this.loadGroup();
  }

  loadGroup(): void {
    if (!this.groupId) return;
    this.groupService.getGroupById(this.groupId!).subscribe(group => {
      this.group = group;
      if(this.currentUser!.id==group.creator_id){
        this.isOwnGroup = true;
      }
      this.loadFollowingState();
    });
  }

  loadFollowingState():void {
    this.groupService.getGroupMembers(this.groupId!).subscribe(members => {
      this.members = members;
      members.forEach(member => {
        if(member.user_id==this.currentUser!.id){
          this.isFollowing = true;
        }
        else {
          this.isFollowing = false;
        }
        console.log('loaded member status');
      });
    })
  }

}
