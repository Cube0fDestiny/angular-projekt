import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { GroupPageHeaderComponent } from '../group-page-header/group-page-header.component';
import { GroupPageSidebarComponent } from '../group-page-sidebar/group-page-sidebar.component';
import { WallComponent } from '../../../shared/components/wall/wall.component';
import { NavbarComponent } from '../../../shared/components/navbar/main/navbar.component';
import { User } from '../../../shared/models/user.model';
import { GroupService } from '../../../core/group/group.service';
import { Group, GroupMember } from '../../../shared/models/group.model';

@Component({
  selector: 'app-group-page',
  standalone: true,
  imports: [GroupPageHeaderComponent, GroupPageSidebarComponent, WallComponent, NavbarComponent, NgIf],
  templateUrl: './group-page.component.html'
})
export class GroupPageComponent implements OnInit {
  groupId: string | null = null;
  highlightedPostId: string | null = null;
  allowedUsers: string[] = [];
  isloading = true;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    // Get userId from route (UUID string)
    this.groupId = this.route.snapshot.paramMap.get('id');
    this.highlightedPostId = this.route.snapshot.paramMap.get('postId');
    this.loadMembers();
  }

  loadMembers():void {
    this.groupService.getGroupMembers(this.groupId!).subscribe(members => {
      members.forEach(member => {
        this.allowedUsers.push(member.user_id);
      });
      this.isloading = false;
      console.log('loaded members: ', this.allowedUsers);
    })
  }
}
