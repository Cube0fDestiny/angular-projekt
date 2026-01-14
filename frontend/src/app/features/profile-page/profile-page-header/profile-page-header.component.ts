import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-page-header.component.html',
  imports: [NgIf, OrangButtonComponent],
  styleUrls: ['./profile-page-header.component.scss']
})
export class ProfilePageHeaderComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isOwnProfile = false;
  @Input() isFriend = false;

  /** Keep as string because backend uses UUIDs */
  userId: string | null = null;

  @Input() stats = {
    friends: 0,
    posts: 0,
    photos: 0
  };

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

  constructor(
    private route: ActivatedRoute,
    public userService: UserService
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
        this.isFriend = false; // Friends system not implemented yet
      });
    }

    console.log('Profile for user:', this.user);
  }

  // Event emitters
  onEditProfile(): void { this.editProfile.emit(); }
  onAddStory(): void { this.addStory.emit(); }
  onViewAs(): void { this.viewAs.emit(); }
  onMessage(): void { this.message.emit(); }
  onAddFriend(): void { this.addFriend.emit(); }
  onUnfriend(): void { this.unfriend.emit(); }
  onMore(): void { this.more.emit(); }
}
