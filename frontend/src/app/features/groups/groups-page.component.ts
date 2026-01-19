import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../core/user/user.service';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { User } from '../../shared/models/user.model';
import { FormsModule } from '@angular/forms';
import { TextDisplayComponent } from "../../shared/components/text-display/text-display.component";
import { OrangButtonComponent } from "../../shared/components/orang-button/orang-button.component";
import { Group, CreateGroupData } from '../../shared/models/group.model';
import { GroupService } from '../../core/group/group.service';

@Component({
  selector: 'groups-page',
  standalone: true,
  imports: [FormsModule, NavbarComponent, TextDisplayComponent, OrangButtonComponent, CommonModule, NgIf],
  templateUrl: './groups-page.component.html'
})
export class GroupsPageComponent implements OnInit {

  user: User | null = null;
  groupBio = '';
  groupName = '';
  isCreatingGroup = false;
  groups: Group[] | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public userService: UserService,
    public groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.user = this.userService.currentUser;
    this.loadAllGroups();
  }

  toggleCreatingGroup():void {
    this.isCreatingGroup = !this.isCreatingGroup;
  }

  getAvatarUrl(group: Group): string {
    return group?.profile_picture_id || 'assets/logo_icon.png';
  }

  createGroup():void {
    if (!this.groupName?.trim()) {
      this.isCreatingGroup = false;
      return;
    }

    const newGroup = {
      name: this.groupName,
      bio: this.groupBio,
      //header_picture_id: '',
      //profile_picture_id: '',
      free_join: false
    }
    
    this.groupService.createGroup(newGroup).subscribe({
      next: () => {
        console.log('Successfully created new group');
        this.isCreatingGroup = false;
        this.loadAllGroups();
      },
      error: (error) => {
        console.error('Failed to create new group:', error);
        this.isCreatingGroup = false;
      }
    });
  }

  goToGroup(groupId: string):void {
    this.router.navigate(['/group', groupId]);
  }

  loadAllGroups():void{
    this.isLoading = true;
    this.groupService.getAllGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.isLoading = false;
        console.log('succesfully loaded groups');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading groups:', error);
      }
    });
  }

}
