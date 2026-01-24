import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/main/home.component';
import { ProfilePageComponent } from './features/profile-page/main/profile-page.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authGuard } from './core/auth/auth.guard'; // Import your guard
import { SettingsComponent } from './features/settings/settings.component';
import { FriendListComponent } from './features/friend-list/friend-list.component';
import { EventsPageComponent } from './features/events/events-page.component';
import { EventPageComponent } from './features/event/main/event-page.component';
import { FollowerListComponent } from './features/follower-list/follower-list.component';
import { MemberListComponent } from './features/member-list/member-list.component';
import { GroupsPageComponent } from './features/groups/groups-page.component';
import { GroupPageComponent } from './features/group/main/group-page.component';
import { ChatComponent } from './features/chat/chat.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Guarded Routes
  { 
    path: 'home', 
    component: HomeComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'events', 
    component: EventsPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'groups', 
    component: GroupsPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'chats', 
    component: ChatComponent, 
    canActivate: [authGuard] 
  },
  {
    path: 'friends/:id',
    component: FriendListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'followers/:id',
    component: FollowerListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'members/:id',
    component: MemberListComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'settings', 
    component: SettingsComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'profile/:id', 
    component: ProfilePageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'profile/:id/:postId', 
    component: ProfilePageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'event/:id', 
    component: EventPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'event/:id/:postId', 
    component: EventPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'group/:id', 
    component: GroupPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'group/:id/:postId', 
    component: GroupPageComponent, 
    canActivate: [authGuard] 
  },
  
  // Redirects at the bottom
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];