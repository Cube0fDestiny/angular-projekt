import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../core/user/user.service';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { User } from '../../shared/models/user.model';
import { FormsModule } from '@angular/forms';
import { TextDisplayComponent } from "../../shared/components/text-display/text-display.component";
import { OrangButtonComponent } from "../../shared/components/orang-button/orang-button.component";
import { OrangEvent, CreateEventData } from '../../shared/models/event.models';
import { EventService } from '../../core/event/event.service';
import { ImageService } from '../../core/image/image.service';

@Component({
  selector: 'events-page',
  standalone: true,
  imports: [FormsModule, NavbarComponent, OrangButtonComponent, CommonModule, NgIf],
  templateUrl: './events-page.component.html'
})
export class EventsPageComponent implements OnInit {

  user: User | null = null;
  eventBio = '';
  eventName = '';
  eventDate = '';
  isCreatingEvent = false;
  events: OrangEvent[] | null = null;
  isLoading = false;
  defaultImage = 'assets/logo_icon.png';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public userService: UserService,
    public eventService: EventService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.user = this.userService.currentUser;
    this.loadAllEvents();
  }

  toggleCreatingEvent():void {
    this.isCreatingEvent = !this.isCreatingEvent;
  }

  createEvent():void {
    if (!this.user) return;
    
    if (!this.eventName?.trim()) {
      this.isCreatingEvent = false;
      return;
    }
    let newEventDate = new Date(this.eventDate);
    console.log(newEventDate.toISOString());

    const newEvent = {
      name: this.eventName,
      bio: this.eventBio,
      event_date: newEventDate.toISOString()
    }
    this.eventService.createEvent(newEvent).subscribe({
      next: (res) => {
        console.log('Successfully created new event');
        this.isCreatingEvent = false;
        this.toggleFollow(res.data.id);
        this.loadAllEvents();
      },
      error: (error) => {
        console.error('Failed to create new event:', error);
        this.isCreatingEvent = false;
      }
    });
  }

  goToEvent(eventId: string):void {
    this.router.navigate(['/event', eventId]);
  }

  loadAllEvents():void{
    this.isLoading = true;
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.isLoading = false;
        console.log('succesfully loaded events');
        this.loadProfileImages()
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading events:', error);
      }
    });
  }

  toggleFollow(eventId: string): void{
    this.eventService.toggleFollowEvent(eventId).subscribe(res => {
      console.log('toggled following event: ', res);
    });
  }

  loadProfileImages(): void {
  // Process each group
    this.events!.forEach(event => {
      if (event.profile_picture_id) {
        // Load image for this group
        this.imageService.getImage(event.profile_picture_id).subscribe({
          next: (imageUrl) => {
            event.profileImageUrl = imageUrl;
          },
          error: () => {
            event.profileImageUrl = this.defaultImage;
          }
        });
      } else {
        // No profile picture id, use default
        event.profileImageUrl = this.defaultImage;
      }
    });
  }

}
