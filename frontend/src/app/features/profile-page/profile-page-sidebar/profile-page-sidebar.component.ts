import { NgFor, NgIf } from '@angular/common';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../../../shared/models/user.model';
import { UserService } from '../../../core/user/user.service';

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-page-sidebar.component.html',
  imports: [NgIf, NgFor, TextDisplayComponent],
  styleUrls: ['./profile-page-sidebar.component.scss']
})
export class ProfilePageSidebarComponent implements OnInit {

  /** Main profile user */
  @Input() user!: User;

  /** Placeholder for groups and photos (mock) */
  @Input() groups: any[] = [];
  @Input() photos: any[] = [];

  /** Events for interactions */
  @Output() userClick = new EventEmitter<string>();
  @Output() groupClick = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<any>();

  /** All users used to display as "friends" temporarily */
  friends: User[] = [];

  /** Current logged-in user */
  currentUser!: User | null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);

    // Load main profile (either from route or current user)
    if (userId) {
      this.userService.getUserById(userId).subscribe(u => this.user = u);
    } else {
      this.user = this.currentUser!;
    }

    // Load all users as "friends" for temporary display
    this.userService.getAllUsers().subscribe(users => {
      // Exclude current user from friends list if you want
      this.friends = users.filter(u => u.id !== this.currentUser?.id);
    });
  }

  /** Navigate to another user's profile */
  goToFriendProfile(userId: string): void {
    this.userClick.emit(userId);
    this.router.navigate(['/users', userId]);
  }

  /** Navigate to group (mock) */
  goToGroup(groupId: number): void {
    this.groupClick.emit(groupId);
    // this.router.navigate(['/group', groupId]); // still mock
  }

  /** Open photo (mock) */
  openPhoto(photo: any): void {
    this.photoClick.emit(photo);
  }
}

