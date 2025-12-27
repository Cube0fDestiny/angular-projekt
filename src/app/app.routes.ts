import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/main/home.component';
import { ProfilePageComponent } from './features/profile-page/main/profile-page.component';
export const routes: Routes = [
  { path: '', component: HomeComponent },  //tu zamień homecomponent na cokolwiek innego i to bd defaultowa strona
 

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  
  // PROFILE ROUTE - direct component
  { path: 'profile/:id', component: ProfilePageComponent },
  
  { path: '**', redirectTo: '/home' },
  { path: '**', redirectTo: '' },  // Wszystko inne też na homepage
];