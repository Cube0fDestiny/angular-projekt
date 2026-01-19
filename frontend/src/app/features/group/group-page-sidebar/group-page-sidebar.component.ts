import { NgFor, NgIf } from '@angular/common';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User, FriendListItem } from '../../../shared/models/user.model';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { OrangEvent, EventFollower } from '../../../shared/models/event.models';
import { forkJoin } from 'rxjs';
import { EventService } from '../../../core/event/event.service';
import { GroupService } from '../../../core/group/group.service';
import { Group, GroupMember } from '../../../shared/models/group.model';

@Component({
  selector: 'app-group-sidebar',
  templateUrl: './group-page-sidebar.component.html',
  imports: [NgIf, FormsModule, NgFor, TextDisplayComponent, OrangButtonComponent],
  styleUrls: ['./group-page-sidebar.component.scss']
})
export class GroupPageSidebarComponent implements OnInit {

  /** Main profile user */
  @Input() user!: User | null;
  group: Group | null = null;
  groupId: string | null = null;
  isOwnGroup = false;

  /** Events for interactions */
  @Output() userClick = new EventEmitter<string>();
  @Output() groupClick = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<any>();

  /** All users used to display as "friends" temporarily */
  members: GroupMember[] = [];
  @Input() photos: any[] = [];

  /** Current logged-in user */
  currentUser!: User | null;

  isEditingBio = false;
  editedBio = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private groupService: GroupService
  ) {}

  toggleEditingBio():void {
    console.log("toggledBio");
    this.isEditingBio = !this.isEditingBio;
    if (this.isEditingBio) {
      this.editedBio = this.group?.bio || '';
    }
  }

  getAvatarUrl(member: GroupMember): string {
    return member.profile_picture_id || 'assets/logo_icon.png';
  }

  updateBio():void {
    if (!this.editedBio?.trim() || this.editedBio === this.group!.bio) {
      this.isEditingBio = false;
      return;
    }
    
    const updatedGroup = {
      bio: this.editedBio
    }

    this.groupService.updateGroup(this.group!.id, updatedGroup).subscribe({
      next: () => {
        this.group!.bio = this.editedBio;
        console.log('Succesfully updated bio')
        this.isEditingBio = false;
      },
      error: (error) => {
        console.error('Failed to update bio:', error);
        this.isEditingBio = false;
      }
    });
  }

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id');

    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadGroup();
    
    
  }

  loadGroup(): void {
    this.groupService.getGroupById(this.groupId!).subscribe(group => {
      this.group = group;
      if(this.currentUser!.id==group.creator_id){
        this.isOwnGroup = true;
      }
      this.editedBio = group.bio;
      this.loadMembers();
    });
  }

  loadMembers():void {
    this.groupService.getGroupMembers(this.groupId!).subscribe(members => {
      this.members = members;
      console.log('loaded members');
    })
  }


  goToMembersList(): void {
    console.log('navigating to members list...');
    this.router.navigate(['/members', this.groupId!]);
  }

  /** Navigate to another user's profile */
  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }
}

