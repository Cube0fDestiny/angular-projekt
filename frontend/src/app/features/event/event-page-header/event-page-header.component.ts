import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
import { User, OutgoingFriendRequest } from '../../../shared/models/user.model';
import { OrangEvent, EventFollower } from '../../../shared/models/event.models';
import { EventService } from '../../../core/event/event.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-event-header',
  templateUrl: './event-page-header.component.html',
  imports: [NgIf, OrangButtonComponent, ImageUploadComponent],
  styleUrls: ['./event-page-header.component.scss']
})
export class EventPageHeaderComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isOwnEvent = false;
  @Input() isFriend = false;

  event: OrangEvent | null = null;
  eventId: string | null = null;

  /** Keep as string because backend uses UUIDs */
  userId: string | null = null;
  isFollowing = false;
  daysUntilEvent = 0;

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
  followers: EventFollower[] = [];

  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    public eventService: EventService
  ) {}

  onImageUploaded(imageId: string): void{
    this.eventService.updateEvent(this.eventId!, {header_picture_id: imageId}).subscribe({
      next: () => {
        console.log('changed header picture');
      },
      error: (error) => {
        console.error('failed to change header image: ', error);
      }
    })
  }

  getAvatarUrl(event: OrangEvent): string {
    return event?.profile_picture_id || 'assets/logo_icon.png';
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.userService.currentUser$.subscribe(u => this.currentUser = u);

    // Get userId from route (if any)
    this.eventId = this.route.snapshot.paramMap.get('id');

    // Load profile data
    this.loadEvent();
  }

  loadEvent(): void {
    if (!this.eventId) return;
    this.eventService.getEventById(this.eventId!).subscribe(event => {
      this.event = event;
      if(this.currentUser!.id==event.creator_id){
        this.isOwnEvent = true;
      }
      this.daysUntilEvent = this.getDaysUntilEvent(event.event_date);
      this.loadFollowingState();
    });
  }

  loadFollowingState():void {
    this.eventService.getEventFollowers(this.eventId!).subscribe(followers => {
      this.followers = followers;
      followers.forEach(follower => {
        if(follower.user_id==this.currentUser!.id){
          this.isFollowing = true;
        }
        else {
          this.isFollowing = false;
        }
        console.log('loaded follower status');
      });
    })
  }

  getDaysUntilEvent(eventDate: string | Date): number {
    const now = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toggleFollow(): void{
    this.eventService.toggleFollowEvent(this.eventId!).subscribe(res => {
      console.log('toggled following event: ', res);
      this.isFollowing = !this.isFollowing;
    });
  }

}
