import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/user/user.service';
import { GroupService } from '../../../core/group/group.service';
import { ImageService } from '../../../core/image/image.service';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  imports: [NgFor, NgIf, OrangButtonComponent, RouterModule],
  styleUrls: ['./left-sidebar.component.scss'],
})
export class LeftSidebarComponent implements OnInit, OnDestroy {
  currentUser: any;
  currentUserAvatar: string = 'assets/logo_icon.png';
  groups: any[] = [];
  proposedGroups: any[] = [];

  defaultImage = 'assets/logo_icon.png';

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private groupService: GroupService,
    private imageService: ImageService,
    private router: Router,
  ) {}

  goToGroups(): void {
    this.router.navigate(['/groups']);
  }

  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  ngOnInit() {
    const userSub = this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadCurrentUserAvatar();
        this.loadUserGroups();
      }
    });
    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCurrentUserAvatar(): void {
    if (this.currentUser?.profile_picture_id) {
      this.imageService.getImage(this.currentUser.profile_picture_id).subscribe({
        next: (imageUrl: string) => {
          this.currentUserAvatar = imageUrl;
        },
        error: () => {
          this.currentUserAvatar = this.defaultImage;
        },
      });
    } else {
      this.currentUserAvatar = this.defaultImage;
    }
  }

  private loadUserGroups(): void {
    this.groupService.getUserGroups(this.currentUser.id).subscribe({
      next: (groups) => {
        if (!groups || groups.length === 0) {
          this.groups = [];
          this.loadProposedGroups();
          return;
        }
        // For each group, fetch member_data from getGroupById
        const groupFetches = groups.map((group) =>
          this.groupService
            .getGroupById(group.id)
            .toPromise()
            .then((fullGroup) =>
              fullGroup && fullGroup.member_data
                ? { ...group, member_data: fullGroup.member_data }
                : group,
            ),
        );
        Promise.all(groupFetches)
          .then((fullGroups) => {
            this.groups = fullGroups;
            this.loadGroupImages(this.groups);
            this.loadProposedGroups();
          })
          .catch((err) => {
            this.groups = groups;
            this.loadGroupImages(this.groups);
            this.loadProposedGroups();
            console.error('Failed to fetch full group data:', err);
          });
      },
      error: (err) => {
        this.groups = [];
        this.loadProposedGroups();
        console.error('Failed to load user groups:', err);
      },
    });
  }

  loadProposedGroups(): void {
    this.groupService.getAllGroups().subscribe({
      next: (allGroups: any[]) => {
        const userGroupIds = new Set(this.groups.map((g: any) => g.id));
        this.proposedGroups = allGroups
          .filter((g: any) => !userGroupIds.has(g.id))
          .slice(0, 5);
        this.loadGroupImages(this.proposedGroups);
      },
      error: (err: any) => {
        this.proposedGroups = [];
        console.error('Failed to load proposed groups:', err);
      },
    });
  }

  loadGroupImages(groups: any[]): void {
    if (!groups) return;
    groups.forEach((group) => {
      if (group.profile_picture_id) {
        this.imageService.getImage(group.profile_picture_id).subscribe({
          next: (imageUrl: string) => {
            group.profileImageUrl = imageUrl;
          },
          error: () => {
            group.profileImageUrl = this.defaultImage;
          },
        });
      } else {
        group.profileImageUrl = this.defaultImage;
      }
    });
  }

  // Organizations
  organizations = [
    {
      id: 1,
      name: 'Tech Corp',
      icon: '🏢',
      category: 'Technology',
      members: 540,
    },
    {
      id: 2,
      name: 'Design Hub',
      icon: '✨',
      category: 'Design',
      members: 320,
    },
    {
      id: 3,
      name: 'Startup Inc',
      icon: '💡',
      category: 'Startup',
      members: 89,
    },
  ];

  // Quick actions
  quickActions = [
    { label: 'Create Group', icon: '➕', action: 'createGroup' },
    { label: 'Discover', icon: '🔍', action: 'discover' },
    { label: 'Events', icon: '📅', action: 'events' },
    { label: 'Memories', icon: '📸', action: 'memories' },
  ];

  onGroupClick(group: any): void {
    this.router.navigate(['/group', group.id]);
  }

  onOrgClick(org: any): void {
    console.log('Organization clicked:', org.name);
  }

  onQuickAction(action: string): void {
    console.log('Quick action:', action);
  }

  joinGroup(groupId: number): void {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      group.isJoined = !group.isJoined;
      console.log(group.isJoined ? 'Joined' : 'Left', group.name);
    }
  }
}