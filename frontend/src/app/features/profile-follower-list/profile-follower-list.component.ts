import { CommonModule } from '@angular/common';
import { TextDisplayComponent } from '../../shared/components/text-display/text-display.component';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { UserService } from '../../core/user/user.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrangButtonComponent } from '../../shared/components/orang-button/orang-button.component';
import { User, UserFollower } from '../../shared/models/user.model';
import { forkJoin } from 'rxjs';
import { OrangEvent, EventFollower } from '../../shared/models/event.models';
import { EventService } from '../../core/event/event.service';
import { ImageService } from '../../core/image/image.service';

@Component({
  selector: 'profile-follower-list',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TextDisplayComponent,
    OrangButtonComponent,
    FormsModule
  ],
  templateUrl: './profile-follower-list.component.html',
})
export class ProfileFollowerListComponent implements OnInit {
  user!: User;
  currentUser!: User | null;
  sectionTitle = 'Users Following Event';
  @Output() userClick = new EventEmitter<string>();
  userId: string | null = null;
  followers: UserFollower[] = [];

  loadedFollowers = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    
    this.userId = this.route.snapshot.paramMap.get('id');
    
    // Subscribe to current user
    this.userService.currentUser$.subscribe(user => this.currentUser = user);

    this.loadUser();
  }

  loadUser(): void {
    this.userService.getUserById(this.userId!).subscribe(user => {
      this.user = user;
      this.sectionTitle = `Users Following "${user.name} ${user.surname}"`;
      if(!user.is_company){
        console.log('not a company profile');
        this.router.navigate(['/']);
      } else {
        this.loadFollowers();
      }
    });
  }

  loadFollowers():void {
    this.userService.getAllFollowers(this.user!.id).subscribe(followers => {
      this.followers = followers;
      console.log('loaded followers');
      followers.forEach(follower => {
        if(!follower.avatar){
          follower.profile_picture_url = 'assets/logo_icon.png';
        }else{
          this.imageService.getImage(follower.avatar).subscribe({
            next: (url) => {
              follower.profile_picture_url = url;
            }
          });
        }
      });
      this.followers = followers;
      console.log('loaded follower profiles');
      this.loadedFollowers = true;
    })
  }

  getAvatarUrl(follower: EventFollower): string {
    return follower.profile_picture_id || 'assets/logo_icon.png';
  }

  goToFriendProfile(userId: string): void {
    console.log(userId);
    this.router.navigate(['/profile', userId]);
  }

  goToProfile(): void {
    this.router.navigate(['/profile', this.userId]);
  }
}