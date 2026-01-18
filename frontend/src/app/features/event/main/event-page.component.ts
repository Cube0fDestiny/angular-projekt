import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/user/user.service';
import { EventPageHeaderComponent } from '../event-page-header/event-page-header.component';
import { EventPageSidebarComponent } from '../event-page-sidebar/event-page-sidebar.component';
import { WallComponent } from '../../../shared/components/wall/wall.component';
import { NavbarComponent } from '../../../shared/components/navbar/main/navbar.component';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [EventPageHeaderComponent, EventPageSidebarComponent, WallComponent, NavbarComponent],
  templateUrl: './event-page.component.html'
})
export class EventPageComponent implements OnInit {
  eventId: string | null = null;

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get userId from route (UUID string)
    this.eventId = this.route.snapshot.paramMap.get('id');
  }
}
