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
  templateUrl: './friend-list.component.html',
})
export class FriendListComponent implements OnInit {
  friends: User[] = [];
  user!: User;
  currentUser!: User | null;
  sectionTitle = 'All Friends';
  @Output() userClick = new EventEmitter<string>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    
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
    this.loadFriends();
  }

  goToFriendProfile(userId: string): void {
    this.userClick.emit(userId);
    this.router.navigate(['/profile', userId]);
  }

  removeFriend(userId: string): void {
    this.userService.removeFriend(userId).subscribe({
      next: (response) => {
        console.log('Friend removed:', response.message);
        
        this.friends = this.friends.filter(friend => friend.id !== userId);
      },
      error: (error) => {
        console.error('Error removing friend:', error);
      }
    });
  }

  loadFriends(): void {
    this.userService.getAllFriends().subscribe({
      next: (friendItems) => {
        if (friendItems.length === 0) {
          this.friends = [];
          console.log('No friends loaded');
          return;
        }
        
        // Extract just the IDs from the response objects
        const friendIds = friendItems.map(item => item.friend_id);
        
        // Create an array of observables
        const friendObservables = friendIds.map(id => 
          this.userService.getUserById(id)
        );
        
        // Wait for all requests to complete
        forkJoin(friendObservables).subscribe({
          next: (users) => {
            this.friends = users.filter(user => user !== null) as User[];
            console.log('Loaded all friends successfully:', this.friends.length);
            this.sectionTitle = `${this.user?.name}'s Friends`;
          },
          error: (error) => {
            console.error('Error loading friends:', error);
            this.friends = [];
          }
        });
      },
      error: (error) => {
        console.error('Error loading friend list:', error);
        this.friends = [];
      }
    });
  }
}