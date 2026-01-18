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

@Component({
  selector: 'app-event-sidebar',
  templateUrl: './event-page-sidebar.component.html',
  imports: [NgIf, FormsModule, NgFor, TextDisplayComponent, OrangButtonComponent],
  styleUrls: ['./event-page-sidebar.component.scss']
})
export class EventPageSidebarComponent implements OnInit {

  /** Main profile user */
  @Input() user!: User | null;
  event: OrangEvent | null = null;
  eventId: string | null = null;
  isOwnEvent = false;

  /** Events for interactions */
  @Output() userClick = new EventEmitter<string>();
  @Output() groupClick = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<any>();

  /** All users used to display as "friends" temporarily */
  followers: EventFollower[] = [];
  @Input() photos: any[] = [];

  /** Current logged-in user */
  currentUser!: User | null;

  isEditingBio = false;
  editedBio = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private eventService: EventService
  ) {}

  toggleEditingBio():void {
    console.log("toggledBio");
    this.isEditingBio = !this.isEditingBio;
    if (this.isEditingBio) {
      this.editedBio = this.event?.bio || '';
    }
  }

  getAvatarUrl(follower: EventFollower): string {
    return follower.profile_picture_id || 'assets/logo_icon.png';
  }

  updateBio():void {
    if (!this.editedBio?.trim() || this.editedBio === this.event!.bio) {
      this.isEditingBio = false;
      return;
    }
    
    const updatedEvent = {
      bio: this.editedBio
    }

    this.eventService.updateEvent(this.event!.id, updatedEvent).subscribe({
      next: () => {
        this.event!.bio = this.editedBio;
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
    this.eventId = this.route.snapshot.paramMap.get('id');

    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadEvent();
    
    
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId!).subscribe(event => {
      this.event = event;
      if(this.currentUser!.id==event.creator_id){
        this.isOwnEvent = true;
      }
      this.editedBio = event.bio;
      this.loadFollowers();
    });
  }

  loadFollowers():void {
    this.eventService.getEventFollowers(this.eventId!).subscribe(followers => {
      this.followers = followers;
      console.log('loaded followers');
    })
  }


  goToFollowersList(): void {
    console.log('navigating to followers list...');
    this.router.navigate(['/followers', this.eventId!]);
  }

  /** Navigate to another user's profile */
  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }
}

