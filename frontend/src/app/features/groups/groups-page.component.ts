import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../core/user/user.service';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { User } from '../../shared/models/user.model';
import { FormsModule } from '@angular/forms';
import { OrangButtonComponent } from "../../shared/components/orang-button/orang-button.component";
import { Group } from '../../shared/models/group.model';
import { GroupService } from '../../core/group/group.service';
import { ImageService } from '../../core/image/image.service';

@Component({
  selector: 'groups-page',
  standalone: true,
  imports: [
    FormsModule, 
    NavbarComponent, 
    OrangButtonComponent, 
    CommonModule, 
    NgIf,
    NgFor
  ],
  templateUrl: './groups-page.component.html',
  styleUrls: ['./groups-page.component.css']
})
export class GroupsPageComponent implements OnInit {
  user: User | null = null;
  groupBio = '';
  groupName = '';
  isCreatingGroup = false;
  groups: Group[] | null = null;
  isLoading = false;
  defaultImage = 'assets/logo_icon.png';
  searchQuery = '';

  constructor(
    private router: Router,
    public userService: UserService,
    public groupService: GroupService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.user = this.userService.currentUser;
    this.loadAllGroups();
  }

  get filteredGroups(): Group[] {
    if (!this.groups) return [];
    if (!this.searchQuery.trim()) return this.groups;
    
    const query = this.searchQuery.toLowerCase();
    return this.groups.filter(group => 
      group.name.toLowerCase().includes(query) ||
      (group.bio && group.bio.toLowerCase().includes(query))
    );
  }

  toggleCreatingGroup(): void {
    this.isCreatingGroup = !this.isCreatingGroup;
    if (!this.isCreatingGroup) {
      this.groupName = '';
      this.groupBio = '';
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
  }

  createGroup(): void {
    if (!this.groupName?.trim()) return;

    const newGroup = {
      name: this.groupName.trim(),
      bio: this.groupBio.trim(),
      free_join: false
    };

    this.groupService.createGroup(newGroup).subscribe({
      next: () => {
        this.isCreatingGroup = false;
        this.groupName = '';
        this.groupBio = '';
        this.loadAllGroups();
      },
      error: (error) => {
        console.error('Failed to create new group:', error);
      }
    });
  }

  goToGroup(groupId: string): void {
    this.router.navigate(['/group', groupId]);
  }

  loadAllGroups(): void {
    this.isLoading = true;
    this.groupService.getAllGroups().subscribe({
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
}