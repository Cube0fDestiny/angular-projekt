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
import { OrangEvent, EventFollower } from '../../shared/models/event.models';
import { EventService } from '../../core/event/event.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TextDisplayComponent,
    OrangButtonComponent,
    FormsModule
  ],
  templateUrl: './follower-list.component.html',
})
export class FollowerListComponent implements OnInit {
  user!: User;
  currentUser!: User | null;
  sectionTitle = 'Users Following Event';
  @Output() userClick = new EventEmitter<string>();
  event: OrangEvent | null = null;
  eventId: string | null = null;
  followers: EventFollower[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    
    this.eventId = this.route.snapshot.paramMap.get('id');
    
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);

    this.loadEvent();
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId!).subscribe(event => {
      this.event = event;
      this.sectionTitle = `Users Following "${event.name}"`;
      this.loadFollowers();
    });
  }

  loadFollowers():void {
    this.eventService.getEventFollowers(this.eventId!).subscribe(followers => {
      this.followers = followers;
      console.log('loaded followers');
    })
  }

  getAvatarUrl(follower: EventFollower): string {
    return follower.profile_picture_id || 'assets/logo_icon.png';
  }

  goToFriendProfile(userId: string): void {
    console.log(userId);
    this.router.navigate(['/profile', userId]);
  }

  goToEvent(): void {
    this.router.navigate(['/event', this.eventId]);
  }
}