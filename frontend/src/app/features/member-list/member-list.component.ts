import { CommonModule } from '@angular/common';
import { TextDisplayComponent } from '../../shared/components/text-display/text-display.component';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { UserService } from '../../core/user/user.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrangButtonComponent } from '../../shared/components/orang-button/orang-button.component';
import { User } from '../../shared/models/user.model';
import { forkJoin } from 'rxjs';
import { Group, GroupMember } from '../../shared/models/group.model';
import { GroupService } from '../../core/group/group.service';
import { ImageService } from '../../core/image/image.service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TextDisplayComponent,
    OrangButtonComponent,
    FormsModule
  ],
  templateUrl: './member-list.component.html',
})
export class MemberListComponent implements OnInit {
  members: GroupMember[] = [];
  group!: Group | null;
  user!: User;
  currentUser!: User | null;
  @Output() userClick = new EventEmitter<string>();
  loadedMembers = false;

  sectionTitle = 'Group Members';
  groupId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private groupService: GroupService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    
    this.groupId = this.route.snapshot.paramMap.get('id');
    
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);

    this.loadGroup();
  }

  loadGroup(): void {
    this.groupService.getGroupById(this.groupId!).subscribe(group => {
      this.group = group;
      this.sectionTitle = `Group "${group.name}" Members`;
      this.loadMembers();
    });
  }

  loadMembers():void {
    this.groupService.getGroupMembers(this.groupId!).subscribe(members => {
      this.members = members;
      console.log('loaded followers');
      members.forEach(member => {
        if(!member.profile_picture_id){
          member.profile_picture_url = 'assets/logo_icon.png';
        }else{
          this.imageService.getImage(member.profile_picture_id).subscribe({
            next: (url) => {
              member.profile_picture_url = url;
            }
          });
        }
      });
      this.members = members;
      console.log('loaded member profiles');
      this.loadedMembers = true;
    })
  }

  getAvatarUrl(member: GroupMember): string {
    return member.profile_picture_id || 'assets/logo_icon.png';
  }

  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  goToGroup(): void {
    this.router.navigate(['/group', this.groupId]);
  }
}