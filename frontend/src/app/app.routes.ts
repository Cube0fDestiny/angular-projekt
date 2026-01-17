import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/main/home.component';
import { ProfilePageComponent } from './features/profile-page/main/profile-page.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authGuard } from './core/auth/auth.guard'; // Import your guard
import { SettingsComponent } from './features/settings/settings.component';
import { FriendListComponent } from './features/friend-list/friend-list.component';

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
    path: 'friends/:id',
    component: FriendListComponent,
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
  
  // Redirects at the bottom
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];