import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/main/navbar.component';
import { ProfileDropdownComponent } from '../../../shared/components/navbar/profile-dropdown/profile-dropdown.component';
import { WallComponent } from '../../../shared/components/wall/wall.component';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from '../right-sidebar/right-sidebar.component';
 
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ProfileDropdownComponent, WallComponent, LeftSidebarComponent, RightSidebarComponent], // Import navbar tutaj
  template: ` 
    <app-navbar></app-navbar>
    <app-left-sidebar> </app-left-sidebar>
    <app-right-sidebar></app-right-sidebar>
    <div class="center-wrapper" style="background: grey !important; height: 200px !important; border: 5px solid yellow !important;">
 
  <app-wall></app-wall>
  
</div> 
  `,
  styles: []
})
export class HomeComponent {}